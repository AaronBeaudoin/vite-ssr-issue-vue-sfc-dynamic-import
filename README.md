# `vite-issue-strip-literal`

1. Run `npm run build`.
2. Go to `dist/server/entrypoint-server.mjs`.
3. On line 22 there is still an `import.meta.glob` which shouldn't be there.
4. Now let's run `npm run dev` and go to `http://localhost:3000`.
5. The server immediately crashes with `__vite_ssr_import_meta__.glob is not a function`.

## The Problem

When Vite processes `import.meta.glob` internally it uses a package called [`strip-literal`](https://github.com/antfu/strip-literal).

In that package there is a function that looks exactly like this:

```ts
export function stripLiteral(code: string) {
  try {
    return stripLiteralAcorn(code)
  }
  catch (e) {
    return stripLiteralRegex(code)
  }
}
```

When processing the `App.vue` file in this project, the `stripLiteralAcorn` function throws an error, causing the result of `stripLiteralRegex` to be used instead. So the two problems we've got here are:

1. `stripLiteralAcorn` shouldn't be throwing an error.
2. `stripLiteralRegex` should return a correct result.

### The Problem in `stripLiteralAcorn`

If you take a look at `dist/server/entrypoint-server.mjs` again and look at line 27, you'll see that the Vue SSR SFC compiler took our `class="whatever"` attribute in `App.vue` and changed it to an object like `{ class: "whatever" }` to be interpolated inside of a template literal. This specific concoction is what causes Acorn to choke.

I've included the `strip-literal` package as a dependecy in this project, so you can see a minimal reproduction of this by hopping into `node` and running the following line:

```js
require("strip-literal").stripLiteralAcorn("`${{ class: 0 }}</`");
```

This is the exact same error which Acorn is throw during the Vite pipeline in `stripLiteralAcorn` above. I've already tried submitting an issue at the Acorn repository, but the author has [stated](https://github.com/acornjs/acorn/issues/1191#issuecomment-1413454994) that this is "a known limitation, and not something that's fixable".

### The Problem in `stripLiteralRegex`

In this function we encounter a bug totally different from the one we just examined. In this case, the `code` string input into `stripLiteralRegex` is having a lot more content stripped than there should be.

If you use a debugger to see the value of `code` before it is transformed by the function, you'll see this:

```js
import __variableDynamicImportRuntimeHelper from "vite/dynamic-import-helper";
const getTestData = async () => {
  const filename = "message";
  console.log(await __variableDynamicImportRuntimeHelper((import.meta.glob("./data/something/*.json")), `./data/something/${filename}.json`));
  console.log(await __variableDynamicImportRuntimeHelper((import.meta.glob("./data/whatever/*.json")), `./data/whatever/${filename}.json`));
};

getTestData();
const _sfc_main = {};

import { mergeProps as _mergeProps } from "vue"
import { ssrRenderAttrs as _ssrRenderAttrs, ssrInterpolate as _ssrInterpolate } from "vue/server-renderer"

function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${
    _ssrRenderAttrs(_mergeProps({ class: "whatever" }, _attrs))
  }>${
    _ssrInterpolate(new Date())
  }</div>`)
}


import { useSSRContext as __vite_useSSRContext } from 'vue'
const _sfc_setup = _sfc_main.setup
_sfc_main.setup = (props, ctx) => {
  const ssrContext = __vite_useSSRContext()
  ;(ssrContext.modules || (ssrContext.modules = new Set())).add("App.vue")
  return _sfc_setup ? _sfc_setup(props, ctx) : undefined
}
import _export_sfc from 'plugin-vue:export-helper'
export default /*#__PURE__*/_export_sfc(_sfc_main, [['ssrRender',_sfc_ssrRender],['__file',"/Users/aryse/Projects/open-source/vite-ssr-issue-vue-sfc-dynamic-import/App.vue"]])
```

But afterwards the return value of the `stripLiteralRegex` function is this:

```js
import __variableDynamicImportRuntimeHelper from "                           ";
const getTestData = async () => {
  const filename = "       ";
  console.log(await __variableDynamicImportRuntimeHelper((import.meta.glob("                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "/Users/aryse/Projects/open-source/vite-ssr-issue-vue-sfc-dynamic-import/App.vue"]])
```

As you can see, a huge part of the `code` value which should not have been omitted has been stripped.
