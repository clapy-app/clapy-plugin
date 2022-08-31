#!/usr/bin/env bash

# Run with sudo

# https://www.tecmint.com/clear-ram-memory-cache-buffer-and-swap-space-on-linux/
# sync; echo 1 > /proc/sys/vm/drop_caches
# sync; echo 2 > /proc/sys/vm/drop_caches
sync; echo 3 > /proc/sys/vm/drop_caches