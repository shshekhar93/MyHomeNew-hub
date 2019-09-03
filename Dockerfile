FROM alpine

# port exposed
EXPOSE 8090
# copy current directory into /mnt
COPY . /mnt

# install dependencies
RUN apk update && \
    apk add nodejs npm && \
    apk add build-base && \
    apk add python && \
    apk add avahi-dev && \
    cd mnt && \
    echo "Installing dependencies" && \
    npm install && \
    echo "Dependencies installed. Running build" && \
    npm run webpack && \
    echo "Build complete. Removing dev dependencies" && \
    npm prune --production && \
    echo "All done. Cleaning up build system" && \
    apk del build-base && \
    apk del python && \
    apk del npm;

# command executed at run
CMD ["/bin/sh", "-c", "cd /mnt; node index.js;"]
