# 1. Start from Ubuntu so we can apt-install steamcmd
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# 2. Install Node.js + SteamCMD deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates curl wget lib32gcc-s1 nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# 3. Download & unpack SteamCMD
RUN mkdir -p /opt/steamcmd && \
    cd /opt/steamcmd && \
    wget https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz && \
    tar -xvzf steamcmd_linux.tar.gz && \
    rm steamcmd_linux.tar.gz

# 4. Add SteamCMD into PATH
ENV PATH="/opt/steamcmd:${PATH}"

# 5. Copy and install your Node app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .

# 6. Expose port & launch
EXPOSE 3000
CMD ["npm", "start"]
