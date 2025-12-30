#!/usr/bin/env sh

if [ "$VERCEL_ENV" = "production" ]; then
  sanity schema deploy && sanity manifest extract --path public/studio/static
fi
