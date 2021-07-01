import winston from 'winston';
import daily from 'winston-daily-rotate-file';

class Logger {
  constructor() {
    if (!Logger.instance) {
      Logger.instance = this;

      this.logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
          winston.format.json(),
        ),
        transports: [
          // new winston.transports.File({filename: '../log/cdb.log'}),
          new winston.transports.DailyRotateFile({
            filename: 'cdb-%DATE%.log',
            dirname: '../log',
            maxSize: '100k',
            maxFiles: '40'
          }),
        ]
      });
    }
    return Logger.instance;
  }
}

const log_class = new Logger();
export default log_class.logger;