const LEVELS = {
    INFO: 'info',
    WARN: 'warning',
    ERROR: 'error',
    DEBUG: 'debug'
};

function Logger(config) {
    this.root = (config && config.root) ? config.root : 'root';

    if (config && config.format && typeof config.format === 'function') {
        this.format = config.format;
    }

    if (config && config.transport && typeof config.transport === 'function') {
        this.transport = config.transport;
    }
}

Logger.prototype = {

    log(data, level) {
        const logObj = this.createLogObject(data, level);
        const message = this.format(logObj);
        this.transport(level, message);
    },

    createLogObject(data, level) {
        if (typeof data !== 'string' && typeof data !== 'object' && typeof data !== 'undefined') {
            throw new Error('Logger.data: invalid data type (must be either string or object)');
        }
        if(data === undefined || data === null) {
            data = '';
        }
        level = level || LEVELS.INFO;
        data = typeof data === 'string' ? {message: data} : data;
        return Object.assign({
                root: this.root,
                level: level
            }, data);
    },

    format(logObj) {
        return JSON.stringify(logObj);
    },

    transport(level, message) {
        const chalk = require('chalk');

        switch (level) {
            case LEVELS.ERROR:
                console.error(chalk.red(message));
                break;
            case LEVELS.WARN:
                console.warn(chalk.yellow(message));
                break;
            case LEVELS.DEBUG:
                console.log(chalk.blue(message));
                break;
            case LEVELS.INFO:
            default:
                console.info(chalk.green(message));
        }
    }
};

module.exports = {Logger, LEVELS};