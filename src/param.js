
function insertValue(template, args) {
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