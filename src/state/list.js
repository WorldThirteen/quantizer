import TypedNode from '../node';
import DefaultNodesFactory from './default_factory';
import { indexedIterator, getSourceValue } from '../utils';
import is from '../is';

export default class List extends TypedNode {
  constructor(value, schema = false) {
    super();

    this.children = [];
    this.schema = schema;

    if (this.constructor.schema) {
      this.schema = this.constructor.schema;
    }

    if (this.schema) {
      if (is.node(this.schema)) {
        const Instance = this.schema;

        if (Instance.schema) {
          this.nested = {
            parse: (...args) => new Instance(...args),
            validate: Instance.schema.validate.bind(Instance.schema),
          };
        } else {
          this.nested = {
            parse: (...args) => new Instance(...args),
            validate: () => ({ count: 0 }),
          };
        }
      } else if (is.schema(this.schema) || is.type(this.schema)) {
        this.nested = this.schema;
      } else if (is.factory(this.schema)) {
        this.nested = {
          parse: (...args) => this.schema.get(...args),
          validate: () => ({ count: 0 }),
        };
      }
    } else {
      this.nested = {
        parse: (...args) => DefaultNodesFactory.get(...args),
        validate: () => ({ count: 0 }),
      };
    }

    if (typeof value !== 'undefined') {
      this.set(value);
    }

    this[Symbol.iterator] = indexedIterator.bind(this);
  }

  clear() {
    this.children = [];

    return this;
  }

  concat(source) {
    if (!is.list(source)) {
      throw new Error('Input value is not a List type');
    }

    const sourceValue = getSourceValue(source);

    for (let i = 0; i < sourceValue.length; i += 1) {
      this.push(sourceValue[i]);
    }

    return this;
  }

  set(source) {
    this.clear();
    const sourceValue = getSourceValue(source);

    for (let i = 0; i < sourceValue.length; i += 1) {
      this.push(sourceValue[i]);
    }

    return this;
  }

  push(value) {
    const sourceValue = getSourceValue(value);

    const validationErr = this.nested.validate(sourceValue);

    if (validationErr.count > 0) {
      throw validationErr;
    } else {
      this.children.push(this.nested.parse(sourceValue));
    }

    return this;
  }

  get(...args) {
    return this.map(node => node
      .get(...args),
    );
  }

  get length() {
    return this.children.length;
  }

  map(handler) {
    let returnedValue;
    const result = [];

    for (let i = 0; i < this.children.length; i += 1) {
      returnedValue = handler(this.children[i], i);
      result.push(returnedValue);
    }

    return result;
  }

  at(index) {
    if (index === 'last') {
      return this.children[this.length - 1];
    }

    if (index === 'first') {
      return this.children[0];
    }

    return this.children[index];
  }

  where(key, value) {
    let _key = key;
    let _value = value;

    if (typeof key === 'object') {
      const name = Object.keys(key)[0];
      _key = name;
      _value = key[name];
    }

    const result = this.filter(node => node.get(_key) === _value);

    if (result.length === 0) {
      return false;
    }

    return result;
  }

  filter(fn) {
    const result = [];

    this.map((node) => {
      if (fn(node) === true) {
        result.push(node);
      }

      return true;
    });

    if (result.length === 0) {
      return [];
    } else if (result.length === 1) {
      return result[0];
    }

    return result;
  }

  sortBy(key) {
    this.children.sort((a, b) => {
      if (a.get(key) > b.get(key)) {
        return 1;
      }

      if (a.get(key) < b.get(key)) {
        return -1;
      }

      return 0;
    });

    return this;
  }

  remove(toRemove) {
    if (Array.isArray(toRemove)) {
      for (let i = toRemove.length - 1; i >= 0; i -= 1) {
        this.remove(toRemove[i]);
      }
    } else {
      this.map((n, index) => {
        if (toRemove === n) {
          this.children.splice(index, 1);
        }

        return true;
      });
    }

    return this;
  }
}
