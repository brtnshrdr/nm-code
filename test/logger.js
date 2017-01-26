const expect = require('chai').expect;
const sinon = require('sinon');
const Logger = require('../logger').Logger;
const LEVELS = require('../logger').LEVELS;

describe('Logger', () => {
    it('should create a new logging instance without a config', () => {
        const log = new Logger();
        expect(log).not.equal(null);
        expect(log).not.equal(undefined);
        expect(log.root).equal('root');
    });

    it('should create a new logging instance with passed in properties', () => {
        const log = new Logger({root: 'Test'});
        expect(log.root).equal('Test');
    });

    it('should override transport and format', () => {
        const transport = () => {
            return 'Test Transport'
        };
        const format = () => {
            return 'Test Format'
        };
        const log = new Logger({transport: transport, format: format});
        expect(log.transport).equal(transport);
        expect(log.format).equal(format);
    });

    it('should NOT override transport and format if they\'re not functions', () => {
        const transport = 'Test Transport';
        const format = 'Test Format';
        const log = new Logger({transport: transport, format: format});
        expect(log.transport).not.equal(transport);
        expect(log.format).not.equal(format);
        expect(typeof log.transport).equal('function');
        expect(typeof log.format).equal('function');
    });

    describe('createLogObject', () => {
        it('should create message property if data is a object, string, or null/undefined', () => {
            const logger = new Logger({});

            let actual = logger.createLogObject('Test');
            let expected = {
                root: 'root',
                message: 'Test',
                level: LEVELS.INFO,
            };
            expect(actual).eql(expected);

            const data = {myData: 'test'};
            actual = logger.createLogObject(data, LEVELS.INFO);
            expected = Object.assign(data, {
                root: 'root',
                level: LEVELS.INFO,
            });
            expect(actual).eql(expected);

            actual = logger.createLogObject(undefined, LEVELS.INFO);
            expected = {
                root: 'root',
                message: '',
                level: LEVELS.INFO,
            };
            expect(actual).eql(expected);

            actual = logger.createLogObject(null, LEVELS.INFO);
            expected = {
                root: 'root',
                message: '',
                level: LEVELS.INFO,
            };
            expect(actual).eql(expected);
        });

        it('should default level to INFO', () => {
            const logger = new Logger();

            const actual = logger.createLogObject('Test');
            const expected = {
                root: 'root',
                message: 'Test',
                level: LEVELS.INFO,
            };
            expect(actual).eql(expected);
        });

        it('should throw an error if data is not a string or object', () => {
            const logger = new Logger();
            expect(() => {
                logger.createLogObject(() => {
                    return 'Test'
                })
            }).to.throw('Logger.data: invalid data type (must be either string or object)');
        });
    });

    describe('log', () => {
        let logger;
        beforeEach(() => {
            logger = new Logger({
                transport: () => {
                }
            }); // Stop console outputs
        });

        it('should call createLogObject with transformed string and level', () => {
            const spy = sinon.spy(logger, 'createLogObject');
            const myData = 'Test';
            logger.log(myData, LEVELS.INFO);
            sinon.assert.calledWith(spy, myData, LEVELS.INFO);
        });

        it('should call createLogObject with data object and level', () => {
            const spy = sinon.spy(logger, 'createLogObject');
            const myData = {myData: 'Test'};
            logger.log(myData, LEVELS.INFO);
            sinon.assert.calledWith(spy, myData, LEVELS.INFO);
        });

        it('should call format with object created from createLogObject', () => {
            const generated = {
                level: LEVELS.INFO,
                message: 'Test',
            };

            const stubSpy = sinon.stub(logger, 'createLogObject', () => {
                return generated;
            });

            const formatSpy = sinon.spy(logger, 'format');
            logger.log('Test', LEVELS.INFO);
            sinon.assert.calledWith(formatSpy, generated);
        });

        it('should call transport with string created from format', () => {
            const generated = 'Test';

            const stubSpy = sinon.stub(logger, 'format', () => {
                return generated;
            });

            const transportSpy = sinon.spy(logger, 'transport');

            logger.log('Test', LEVELS.INFO);

            sinon.assert.calledWith(transportSpy, LEVELS.INFO, generated);
        });
    });

    describe('transport', () => {
        // Unfortunately, stubbing console like this will make the output not appear for the tests when they succeed.
        beforeEach(() => {
            this.cStub1 = sinon.stub(console, "info");
            this.cStub2 = sinon.stub(console, "log");
            this.cStub3 = sinon.stub(console, "error");
            this.cStub4 = sinon.stub(console, "warn");
        });
        afterEach(() => {
            this.cStub1.restore();
            this.cStub2.restore();
            this.cStub3.restore();
            this.cStub4.restore();
        });

        it('should call console.method with passed in data', () => {
            const chalk = require('chalk');
            const logger = new Logger();
            const message = 'Test';

            let count = 0;
            logger.transport(LEVELS.INFO, message + (++count));
            sinon.assert.calledWith(console.info, chalk.green(message + count));
            logger.transport(LEVELS.DEBUG, message + (++count));
            sinon.assert.calledWith(console.log, chalk.blue(message + count));
            logger.transport(LEVELS.WARN, message + (++count));
            sinon.assert.calledWith(console.warn, chalk.yellow(message + count));
            logger.transport(LEVELS.ERROR, message + (++count));
            sinon.assert.calledWith(console.error, chalk.red(message + count));
            logger.transport('Invalid', message + (++count));
            sinon.assert.calledWith(console.info, chalk.green(message + count));
        });

        it('should call custom transport method', () => {
            const logger = new Logger({
                transport: (level, message) => {
                    console.error(message); // Call error no matter what
                }
            });
            logger.transport(LEVELS.INFO, 'Test');
            sinon.assert.calledWith(console.error, 'Test');
        });

        it('should call custom format method', () => {
            const logger = new Logger({
                format: (logObj) => {
                    console.log(logObj); // Call error no matter what
                    return JSON.stringify(logObj);
                }
            });
            const data = {myData: 'Test'};
            logger.format(data);
            sinon.assert.calledWith(console.log, data);
        });
    });
});