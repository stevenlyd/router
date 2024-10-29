#!/bin/bash
echo Building...

pnpm build

echo Copying...

rm -rf C:/Users/yliu/Documents/Projects/accounts-receivable/node_modules/.vite
rm -rf C:/Users/yliu/Documents/Projects/accounts-receivable/node_modules/@tanstack/react-router/dist
cp -r ./dist C:/Users/yliu/Documents/Projects/accounts-receivable/node_modules/@tanstack/react-router

echo Done!