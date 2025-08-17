MAKEFLAGS 		+= --silent

VOLUMES_DIR		:= volumes/
DB_DIR			:= backEnd/dataBase/
MM_DIR			:= backEnd/matchMaker/
SP_DIR			:= backEnd/serverPong/
UM_DIR			:= backEnd/userManagement/
WS_DIR			:= backEnd/webServer/

COMPOSE_FILE	:= docker-compose.yml


# Instala y actualiza node.js npm, nvm, npx (necesario en los mac de 42)
toolchain:
	echo "Updating npm, nvm and node.js"
	@curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
	@export NVM_DIR="$$HOME/.nvm"; \
		[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"; \
		nvm install --lts

# Crea una plantilla de servicio nueva
new:
	@if [ -z "$(word 2, $(MAKECMDGOALS))" ]; then \
		echo "Error: Use like: make new backEnd/newService"; \
		exit 1; \
	fi
	@python3 .misc/newService.py $(word 2, $(MAKECMDGOALS))
%:
	@:

# Visualiza por consola el output de un container
peek:
	@if [ -z "$(word 2, $(MAKECMDGOALS))" ]; then \
		echo "Error: Use like: make peek service"; \
		exit 1; \
	fi
	@docker compose logs -f $(word 2, $(MAKECMDGOALS))
%:
	@:

track:
	@docker compose logs -f

bash:
	@if [ -z "$(word 2, $(MAKECMDGOALS))" ]; then \
		echo "Error: Use like: make bash service container"; \
		exit 1; \
	fi
	@docker exec -it $(word 2, $(MAKECMDGOALS)) bash

all: build

build:
	@echo "Building docker images..."
	@mkdir -p volumes/dataBase-volume/
	@mkdir -p volumes/webServer-volume/website/public/avatars/
	@make -C $(DB_DIR) install
	@make -C $(MM_DIR) install
	@make -C $(SP_DIR) install
	@make -C $(UM_DIR) install
	@make -C $(WS_DIR) install

	@docker compose -f $(COMPOSE_FILE) build

build_nc:
	@echo "Building docker images..."
	@mkdir -p volumes/dataBase-volume/
	@mkdir -p volumes/webServer-volume/website/public/avatars/
	@make -C $(DB_DIR) install
	@make -C $(MM_DIR) install
	@make -C $(SP_DIR) install
	@make -C $(UM_DIR) install
	@make -C $(WS_DIR) install

	@docker compose -f $(COMPOSE_FILE) build --no-cache

up: down build
	@echo "Setting services online..."
	@docker compose -f $(COMPOSE_FILE) up -d

upnc: down build_nc
	@echo "Setting services online..."
	@docker compose -f $(COMPOSE_FILE) up -d

down:
	@echo "Setting services offline..."
	@docker compose -f $(COMPOSE_FILE) down

clean:
	@echo "Cleaning docker..."
	@docker compose -f $(COMPOSE_FILE) down --volumes --remove-orphans
	@make -C $(DB_DIR) clean
	@make -C $(MM_DIR) clean
	@make -C $(SP_DIR) clean
	@make -C $(UM_DIR) clean
	@make -C $(WS_DIR) clean
	
fclean: clean
	@echo "Force cleaning whole project..."
	@docker system prune -a -f
	@rm -rf volumes

server:
	@make -C $(WS_DIR) clean
	@make -C $(WS_DIR) install


re: fclean build up

.PHONY: all build up down clean re new