# Gunakan base Ubuntu yang ringan
FROM ubuntu:22.04

# Supaya apt non-interactive
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies dasar + Node.js + npm
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      wget \
      lib32gcc-s1 \
      nodejs \
      npm && \
    rm -rf /var/lib/apt/lists/*

# Install SteamCMD
RUN mkdir -p /opt/steamcmd && \
    cd /opt/steamcmd && \
    wget https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz && \
    tar -xvzf steamcmd_linux.tar.gz && \
    rm steamcmd_linux.tar.gz

# Tambahkan SteamCMD ke PATH
ENV PATH="/opt/steamcmd:${PATH}"

# Copy aplikasi
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production
COPY . .

# Expose port yang dipakai server.js
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]
