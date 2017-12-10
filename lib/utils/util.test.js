const test = require("ava")

const {
  pick,
  omit,
} = require("./util")

test("pick string", t => {

  const src = { a: "", b: "", c: "" }

  t.deepEqual(pick(src, "b"), { b: "" })
})

test("pick [string]", t => {

  const src = { a: "", b: "", c: "" }

  t.deepEqual(pick(src, null), {})
  t.deepEqual(pick(src, []), {})
  t.deepEqual(pick(src, ["a"]), { a: "" })
  t.deepEqual(pick(src, ["a", "b"]), { a: "", b: "" })
  t.deepEqual(pick(src, ["a", "b", "c"]), { a: "", b: "", c: ""})
  t.deepEqual(pick(src, ["a", "b", "c", "d"]), { a: "", b: "", c: ""})
})

test("omit string", t => {

  const src = { a: "", b: "", c: "" }

  t.deepEqual(omit(src, "b"), { a: "", c: "" })
})

test("omit [string]", t => {

  const src = { a: "", b: "", c: "" }

  t.deepEqual(omit(src, null), { a: "", b: "", c: "" })
  t.deepEqual(omit(src, []), { a: "", b: "", c: "" })
  t.deepEqual(omit(src, ["a"]), { b: "", c: "" })
  t.deepEqual(omit(src, ["a", "b"]), { c: "" })
  t.deepEqual(omit(src, ["a", "b", "c"]), {})
  t.deepEqual(omit(src, ["a", "b", "c", "d"]), {})
})
