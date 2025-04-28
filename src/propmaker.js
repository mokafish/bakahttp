export default class PropMaker {
  /**
   * @param {string} template
   * @param {string[]} rules
   * 
      Make number: 
          X-Y   ramdom integer
          X:Y   cycle increment integer

      Make timestamp: 
          ts   integer of seconds
          tm   decimal of seconds.millisecond
          ms   integer of millisecond

      Make string:  
          sX-Y  ramdom length words and numbers
          wX-Y  ramdom length and words
          hX-Y  random length hex value

      Make other:  
          uuid  uuid4() 8-4-4-4-12 format string
          A,B,C,...  random enumeration value

      *Rule abbr. (number/string)*
          X-  => X-2147483647
          Y   => 0-Y
          X:  => X:2147483647
          :Y  => 0:Y 
   */
  constructor(template, rules) {
    this.template = template;
    this.rules = rules;
    this.generators = rules.map((rule) => this.parseRule(rule));
  }
  /**
   * 
   * @param {string} rule 
   * @returns 
   */
  parseRule(rule) {
    // 处理枚举类型（逗号分隔）
    if (rule.includes(",")) {
      const values = rule.split(",");
      return this.makeEnumGenerator(values);
    }

    // 处理时间戳类型
    if (["ts", "tm", "ms"].includes(rule)) {
      return this.makeTimestampGenerator(rule);
    }

    // 处理字符串类型（s, w, h 开头）
    const stringMatch = rule.match(/^([swhH])(.+)$/);
    if (stringMatch) {
      const type = stringMatch[1];
      const param = stringMatch[2];
      const { min, max } = this.parseNumberParam(param);
      return this.makeStringGenerator(type, min, max);
    }

    // 处理 UUID
    if (rule === "uuid") {
      return this.makeUuidGenerator();
    }

    // 处理数字类型
    const numberRule = this.parseNumberRule(rule);
    if (numberRule) {
      return numberRule.mode === "random"
        ? this.makeRandomNumberGenerator(numberRule.min, numberRule.max)
        : this.makeCyclicNumberGenerator(numberRule.min, numberRule.max);
    }

    throw new Error(`Invalid rule: ${rule}`);
  }

  parseNumberParam(param) {
    const parsed = this.parseNumberRule(param);
    if (!parsed || parsed.mode !== "random") {
      throw new Error(`Invalid string parameter: ${param}`);
    }
    return { min: parsed.min, max: parsed.max };
  }

  parseNumberRule(rule) {
    const maxInt = 2147483647;
    let mode = "random";
    let parts = [];

    if (rule.includes("-")) {
      mode = "random";
      parts = rule.split("-");
    } else if (rule.includes(":")) {
      mode = "cyclic";
      parts = rule.split(":");
    } else {
      mode = "random";
      parts = ["0", rule];
    }

    if (parts.length > 2) return null;

    let startStr, endStr;
    if (mode === "random") {
      if (rule.endsWith("-")) {
        startStr = parts[0];
        endStr = "";
      } else if (rule.startsWith("-")) {
        startStr = "0";
        endStr = parts[1];
      } else {
        startStr = parts[0] || "0";
        endStr = parts[1] || "";
      }
    } else {
      if (rule.endsWith(":")) {
        startStr = parts[0];
        endStr = "";
      } else if (rule.startsWith(":")) {
        startStr = "0";
        endStr = parts[1];
      } else {
        startStr = parts[0] || "0";
        endStr = parts[1] || "";
      }
    }

    const start = startStr ? parseInt(startStr, 10) : 0;
    const end = endStr ? parseInt(endStr, 10) : mode === "random" ? maxInt : maxInt;
    if (isNaN(start) || isNaN(end)) return null;

    const adjustedStart = Math.min(start, end);
    const adjustedEnd = Math.max(start, end);

    return { mode, min: adjustedStart, max: adjustedEnd };
  }

  makeEnumGenerator(values) {
    return {
      next: () => values[Math.floor(Math.random() * values.length)],
    };
  }

  makeTimestampGenerator(type) {
    return {
      next: () => {
        const now = Date.now();
        switch (type) {
          case "ts":
            return Math.floor(now / 1000);
          case "tm":
            return (now / 1000).toFixed(3);
          case "ms":
            return now;
          default:
            return "";
        }
      },
    };
  }

  makeStringGenerator(type, min, max) {
    const chars = {
      s: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      w: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      h: "0123456789abcdef",
      H: "0123456789ABCDEF",
    }[type];

    return {
      next: () => {
        const length = Math.floor(Math.random() * (max - min + 1)) + min;
        let str = "";
        for (let i = 0; i < length; i++) {
          str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
      },
    };
  }

  makeUuidGenerator() {
    return {
      next: () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8; 
          return v.toString(16);
        });
      },
    };
  }

  makeRandomNumberGenerator(min, max) {
    return {
      next: () => Math.floor(Math.random() * (max - min + 1)) + min,
    };
  }

  makeCyclicNumberGenerator(min, max) {
    let current = min;
    return {
      next: () => {
        const val = current;
        current = current >= max ? min : current + 1;
        return val;
      },
    };
  }

  next() {
    return render_template(this.template, this.nextProps());
  }

  nextProps() {
    return this.generators.map((gen) => gen.next());
  }
}

export function render_template(template, args) {
  let implicitIndex = 0;
  return template.replace(/\{(\d+)?\}/g, (match, p1) => {
    if (p1 !== undefined) {
      const explicitIndex = parseInt(p1, 10) - 1;
      if (explicitIndex < 0 || explicitIndex >= args.length) {
        return match; // 越界时返回原占位符
      }
      return args[explicitIndex];
    } else {
      if (implicitIndex >= args.length) {
        return match; // 越界时返回原占位符
      }
      return args[implicitIndex++];
    }
  });
}