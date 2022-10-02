#!/bin/bash
set -e

# Replace "task_queue" with your database name
psql -U postgres -c 'CREATE DATABASE task_queue'