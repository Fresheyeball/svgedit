{
  description = "SVGEdit - web-based SVG drawing editor";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { 
          inherit system;
          config = {
            allowUnfree = true; # Required for some Cypress dependencies
          };
        };

        # Node.js and npm dependencies
        nodejs = pkgs.nodejs_20;
        
        # Essential libraries for Cypress on NixOS
        cypressRunDeps = with pkgs; [
          # X11 and graphics libraries
          xorg.libX11
          xorg.libXext
          xorg.libXrender
          xorg.libXtst
          xorg.libXrandr
          xorg.libXi
          xorg.libXft
          xorg.libXScrnSaver
          xorg.libXcomposite
          xorg.libXdamage
          xorg.libXfixes
          xorg.libXcursor
          
          # GTK and graphics support
          gtk3
          gdk-pixbuf
          cairo
          pango
          atk
          glib
          
          # Audio libraries
          alsa-lib
          pulseaudio
          
          # Additional system libraries
          libuuid
          nspr
          nss
          cups
          dbus
          expat
          libdrm
          mesa
          
          # Font support
          fontconfig
          freetype
          
          # Additional dependencies for Electron/Chromium
          at-spi2-core
          at-spi2-atk
          libxkbcommon
          xorg.libxshmfence
          
          # Standard library support
          glibc
          gcc-unwrapped.lib
          
          # Display server
          xvfb-run
        ];

        # Build the project
        svgEditPackage = pkgs.stdenv.mkDerivation {
          pname = "svgedit";
          version = "7.0.0"; # Update as needed
          
          src = ./.;
          
          nativeBuildInputs = [ nodejs pkgs.python3 ];
          buildInputs = cypressRunDeps;
          
          buildPhase = ''
            export HOME=$TMPDIR
            export npm_config_cache=$TMPDIR/.npm
            
            # Install dependencies
            npm ci --no-audit --prefer-offline
            
            # Build svgcanvas first
            npm run build --workspace @svgedit/svgcanvas
            
            # Build the editor
            npm run build
          '';
          
          installPhase = ''
            mkdir -p $out
            cp -r dist/* $out/
            cp -r src $out/src
            cp package*.json $out/
          '';
          
          # Skip tests in build phase - we'll run them separately
          doCheck = false;
        };
        
        # Create a shell environment for development
        devShell = pkgs.mkShell {
          buildInputs = [
            nodejs
            pkgs.python3
            pkgs.cypress
          ] ++ cypressRunDeps;
          
          shellHook = ''
            export CYPRESS_CACHE_FOLDER="$HOME/.cache/Cypress"
            export CYPRESS_RUN_BINARY="${pkgs.cypress}/bin/Cypress"
            export DISPLAY=:0
            
            # Ensure Cypress can find required libraries
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath cypressRunDeps}:$LD_LIBRARY_PATH"
            
            echo "SVGEdit development environment"
            echo "Node.js $(node --version)"
            echo "Available commands:"
            echo "  npm run start    - Start development server"
            echo "  npm run test     - Run Cypress tests"
            echo "  npm run build    - Build production bundle"
          '';
        };

        # Create a test environment that runs Cypress tests
        cypressTest = pkgs.writeScriptBin "cypress-test" ''
          #!${pkgs.bash}/bin/bash
          set -euo pipefail
          
          export HOME=$TMPDIR
          export npm_config_cache=$TMPDIR/.npm
          export CYPRESS_CACHE_FOLDER=$TMPDIR/.cypress
          
          # Setup display for headless testing
          export DISPLAY=:99
          
          # Start Xvfb for headless display
          ${pkgs.xvfb-run}/bin/xvfb-run -a -s "-screen 0 1280x1024x24" bash -c "
            cd ${self}
            
            # Install dependencies
            ${nodejs}/bin/npm ci --no-audit --prefer-offline
            
            # Build svgcanvas
            ${nodejs}/bin/npm run build --workspace @svgedit/svgcanvas
            
            # Start the development server in background
            ${nodejs}/bin/npm run start &
            SERVER_PID=\$!
            
            # Wait for server to be ready
            sleep 10
            
            # Run Cypress tests
            ${nodejs}/bin/npm run test -- --headless
            
            # Cleanup
            kill \$SERVER_PID || true
          "
        '';

        # Define the actual check derivation
        cypressCheck = pkgs.stdenv.mkDerivation {
          name = "svgedit-cypress-tests";
          src = ./.;
          
          nativeBuildInputs = [ 
            nodejs 
            pkgs.python3 
            pkgs.xvfb-run 
            pkgs.procps # for kill command
            pkgs.nettools # for netstat
            pkgs.curl # for health checks
            pkgs.coreutils # for timeout
          ];
          buildInputs = cypressRunDeps;
          
          buildPhase = ''
            export HOME=$TMPDIR
            export npm_config_cache=$TMPDIR/.npm
            export CYPRESS_CACHE_FOLDER=$TMPDIR/.cypress
            export CYPRESS_RUN_BINARY=${pkgs.cypress}/bin/Cypress
            export NODE_ENV=test
            
            # Ensure we have all the dynamic library paths
            export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath cypressRunDeps}:$LD_LIBRARY_PATH"
            
            # Install dependencies
            npm ci --no-audit --prefer-offline
            
            # Build svgcanvas and react-test workspaces
            npm run build --workspace=packages/svgcanvas
            if [ -d "packages/react-test" ]; then
              npm run build --workspace=packages/react-test || echo "react-test workspace not found, continuing..."
            fi
          '';
          
          checkPhase = ''
            export DISPLAY=:99
            
            # Start Xvfb for headless testing with proper cleanup
            xvfb-run -a -s "-screen 0 1280x1024x24 -ac +extension GLX +render -noreset" bash -c "
              set -e
              
              echo 'Starting development server...'
              timeout 300 bash -c 'npm run start > server.log 2>&1 &
              SERVER_PID=\$!
              echo \$SERVER_PID > server.pid
              
              # Wait for server to be ready by checking the log or port
              echo \"Waiting for server to start (PID: \$SERVER_PID)...\"
              for i in {1..60}; do
                if curl -s http://localhost:8000/src/editor/index.html > /dev/null 2>&1; then
                  echo \"Server is ready after \$i seconds\"
                  break
                fi
                if [ \$i -eq 60 ]; then
                  echo \"Server failed to start within 60 seconds\"
                  cat server.log
                  exit 1
                fi
                sleep 1
              done
              
              echo \"Running Cypress tests...\"
              # Run the full test suite as defined in package.json
              NODE_ENV=test npm run test || {
                echo \"Cypress tests failed\"
                if [ -f server.pid ]; then
                  kill \$(cat server.pid) 2>/dev/null || true
                fi
                cat server.log
                exit 1
              }
              
              # Cleanup
              if [ -f server.pid ]; then
                kill \$(cat server.pid) 2>/dev/null || true
              fi
              ' || {
                echo \"Test execution timed out or failed\"
                exit 1
              }
            "
          '';
          
          installPhase = ''
            mkdir -p $out
            echo "Cypress tests completed successfully" > $out/test-results.txt
            
            # Copy any test artifacts if they exist
            if [ -d "cypress/videos" ]; then
              cp -r cypress/videos $out/ || true
            fi
            if [ -d "cypress/screenshots" ]; then
              cp -r cypress/screenshots $out/ || true
            fi
            if [ -f "coverage/coverage-summary.json" ]; then
              cp -r coverage $out/ || true
            fi
          '';
          
          doCheck = true;
        };

      in {
        packages = {
          default = svgEditPackage;
          svgedit = svgEditPackage;
        };
        
        devShells.default = devShell;
        
        apps = {
          cypress-test = {
            type = "app";
            program = "${cypressTest}/bin/cypress-test";
          };
        };
        
        # Expose the check so it can be run with `nix flake check`
        checks = {
          cypress = cypressCheck;
          
          # Also add a simple lint check
          lint = pkgs.stdenv.mkDerivation {
            name = "svgedit-lint";
            src = ./.;
            nativeBuildInputs = [ nodejs ];
            buildPhase = ''
              export HOME=$TMPDIR
              export npm_config_cache=$TMPDIR/.npm
              npm ci --no-audit --prefer-offline
            '';
            checkPhase = ''
              npm run lint
            '';
            installPhase = ''
              mkdir -p $out
              echo "Lint check completed successfully" > $out/lint-results.txt
            '';
            doCheck = true;
          };
        };
      }
    );
}