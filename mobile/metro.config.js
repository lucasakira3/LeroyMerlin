const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "..")];
// Mantém a resolução das dependências internas do Expo Router. Os módulos
// compartilhados fora de mobile são funções puras e não importam React do site.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
module.exports = config;
