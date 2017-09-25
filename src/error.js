import { sym } from './utils';
import is from './is';

function tab(depth) {
  return '  '.repeat(depth);
}

export class DefaultError {
  constructor(message) {
    this[sym('error')] = true;
    this.count = 1;
    this.message = message;
  }

  formatMessage() {
    return this.message;
  }

  static formatError(err) {
    function formatErrorPart(obj, depth, padBrackets) {
      if (depth === 0 && typeof obj === 'object') {
        return `\n${obj.name} ${formatErrorPart(obj, 1)}`;
      }

      if (obj instanceof DefaultError) {
        return `'${obj.formatMessage().slice(0, -1)}'\n`;
      }

      if (typeof obj === 'object' && obj.list) {
        return `[\n${
          obj.list.map(o => formatErrorPart(o, depth + 1, true)).join('')
        }${tab(depth - 1)}]\n`;
      }

      if (typeof obj === 'object' && obj.map) {
        const children = obj.map;
        const padLeft = tab(padBrackets ? depth - 1 : 0);

        return `${padLeft}{\n${
          Object.keys(children).filter((key) => {
            if (key === 'name' && typeof children[key] === 'string') {
              return false;
            }
            if (key === 'count') {
              return false;
            }
            return true;
          })
            .map(key =>
              `${tab(depth)}${key}: ${formatErrorPart(children[key], depth + 1)}`).join('')
        }${tab(depth - 1)}}\n`;
      }

      return '';
    }
    return formatErrorPart(err, 0);
  }
}

export class ValidationError extends DefaultError {
  constructor(expected, actual, key = false) {
    super();

    this.expected = expected;
    this.actual = actual;
    this.key = key;
  }

  formatMessage() {
    return `Expected ${this.expected} but ${this.actual}\n`;
  }
}

export class RequirementError extends DefaultError {
  constructor(keyName) {
    super();

    this.keyName = keyName;
  }

  formatMessage() {
    return `Value ${this.keyName} required but undefined\n`;
  }
}

export class UndeclaredError extends DefaultError {
  constructor(keyName) {
    super();

    this.keyName = keyName;
  }

  formatMessage() {
    return `Field ${this.keyName} undeclared at Schema]\n`;
  }
}
