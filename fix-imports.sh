#!/bin/bash
echo "Fixing import paths..."

# Fix x402Router imports
sed -i "s|from '../x402/client'|from '../x402/client'|g" server/src/routers/x402Router.ts
sed -i "s|from '../internal/x402'|from '../internal/x402'|g" server/src/routers/x402Router.ts  
sed -i "s|from '../../lib/logger'|from '../../lib/logger'|g" server/src/routers/x402Router.ts

# Fix demo app imports - use absolute paths from server/src
sed -i "s|from '../../server/src/x402/client'|from '../../../server/src/x402/client'|g" examples/x402-demo/app.ts
sed -i "s|from '../../server/src/internal/x402'|from '../../../server/src/internal/x402'|g" examples/x402-demo/app.ts

echo "Import paths fixed!"
