FROM debian:bullseye-slim

RUN apt update && apt install nginx openssl -y

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \ 
	-keyout /etc/ssl/private/proxy.key \
	-out /etc/ssl/certs/proxy.crt \
	-subj="/C=ES/ST=Barcelona/L=Barcelona/O=42School/OU=transcend/CN=transcend.42.fr"

COPY conf/default.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]