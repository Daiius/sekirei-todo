#!/bin/bash

docker compose -f docker-compose-prod.yml up #--build

docker cp sekirei-todo-nextjs:/app/.next ./next-prod

docker compose -f docker-compose-prod.yml down

