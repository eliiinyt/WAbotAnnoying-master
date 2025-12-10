const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (!fs.existsSync(this.configPath)) {
        return { groups: {} };
      }
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading config:', error);
      return { groups: {} };
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  getGroupConfig(groupId) {
    if (!this.config.groups[groupId]) {
      this.config.groups[groupId] = { autodownload: false };
      this.saveConfig();
    }
    return this.config.groups[groupId];
  }

  setGroupConfig(groupId, key, value) {
    if (!this.config.groups[groupId]) {
      this.config.groups[groupId] = {};
    }
    this.config.groups[groupId][key] = value;
    this.saveConfig();
  }
}

module.exports = ConfigManager;
