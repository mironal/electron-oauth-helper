import { pick, omit } from "../utils"

test("pick string", () => {
  const src = { a: "", b: "", c: "" }

  expect(pick(src, "b")).toEqual({ b: "" })
})

test("pick [string]", () => {
  const src = { a: "", b: "", c: "" }

  expect(pick(src, ["a"])).toEqual({ a: "" })
  expect(pick(src, ["a", "b"])).toEqual({ a: "", b: "" })
  expect(pick(src, ["a", "b", "c"])).toEqual({ a: "", b: "", c: "" })
})

test("omit string", () => {
  const src = { a: "", b: "", c: "" }

  expect(omit(src, "b")).toEqual({ a: "", c: "" })
})

test("omit [string]", () => {
  const src = { a: "", b: "", c: "" }

  expect(omit(src, ["a"])).toEqual({ b: "", c: "" })
  expect(omit(src, ["a", "b"])).toEqual({ c: "" })
  expect(omit(src, ["a", "b", "c"])).toEqual({})
})
