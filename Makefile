COMPOSE := docker-compose -f docker-compose.yml



copy_cert:
	@docker cp kibana:/usr/share/kibana/config/certs/ca/ca.crt ./ca.crt

clean:
	@$(COMPOSE) down -v
	@rm ca.crt

populate_elastic:
	@echo Populating Elastic in progress..
	@python -c "from server.search.elastic_search import Search; Search()"
	@echo Elastic populated

full_start:
	@$(COMPOSE) up -d
	@make copy_cert
	@make populate_elastic



