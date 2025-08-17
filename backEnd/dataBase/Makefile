SRC_DIR		:= src/
DIST_DIR	:= dist/
NAME		:= database.js
NODES_DIR	:= node_modules/
TSC			:= $(NODES_DIR)/.bin/tsc

all: run

build:
	@echo "Installing dependencies..."
	@npm install
	@echo "Transpiling TypeScript..."
	@$(TSC)

run: build
	@echo "Setting dataBase online..."
	@node $(DIST_DIR)$(NAME)

clean:
	@echo "Cleaning dataBase..."
	@rm -rf $(DIST_DIR) $(NODES_DIR)

install:
	@npm install

re: clean build

.PHONY: all build run clean re
