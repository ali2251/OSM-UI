#!/bin/sh
rm -rf pool
rm -rf dists
mkdir -p pool/UI
mv .build/*.deb pool/UI/
mkdir -p dists/unstable/UI/binary-amd64/
apt-ftparchive packages pool/UI > dists/unstable/UI/binary-amd64/Packages
gzip -9fk dists/unstable/UI/binary-amd64/Packages
