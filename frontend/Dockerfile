# --- Zaraz Boutique web (static storefront + admin) ------------------------
FROM nginx:1.27-alpine

# The official image runs envsubst over /etc/nginx/templates/*.template at
# startup, so API_UPSTREAM can be pointed at any backend host without a rebuild.
ENV API_UPSTREAM=http://api:4000

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY . /usr/share/nginx/html

# Ensure nginx's unprivileged worker user can read every asset, regardless of
# the permission bits the build context happened to carry.
RUN rm -f /usr/share/nginx/html/nginx.conf.template \
 && rm -rf /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/.dockerignore \
 && chmod -R a+rX /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
