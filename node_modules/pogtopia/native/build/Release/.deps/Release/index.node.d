cmd_Release/index.node := ln -f "Release/obj.target/index.node" "Release/index.node" 2>/dev/null || (rm -rf "Release/index.node" && cp -af "Release/obj.target/index.node" "Release/index.node")
