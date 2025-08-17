SRC_DIR		:= conf/website/src/
DIST_DIR	:= conf/website/dist/
NAME		:= webserver.js
NODES_DIR	:= node_modules/
TSC			:= $(NODES_DIR)/.bin/tsc

all: build

build:
	@echo "Instalando dependencias..."
	@npm install
	@echo "Compilando TypeScript..."
	@$(TSC)

install:
	@npm install

clean:
	@echo "Limpiando proyecto Webserver..."
	@rm -rf $(NODES_DIR)
	@rm -rf $(DIST_DIR) 

re: clean build

.PHONY: all build run clean re
