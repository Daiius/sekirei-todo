#!/bin/bash

docker compose -f docker-compose.yml -f docker-compose-prod.yml up --build

docker compose -f docker-compose.yml -f docker-compose-prod.yml down

