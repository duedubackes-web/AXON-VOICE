import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("regional profiles include diverse identities",()=>{
 const file=readFileSync(new URL("../src/lib/regions.ts",import.meta.url),"utf8");
 for(const id of ["gaucho","catarinense","carioca","paulista","mineiro","baiano","pernambucano"]) assert.ok(file.includes('id:"'+id+'"'));
});
test("the client does not contain a server-side secret reference",()=>{
 const page=readFileSync(new URL("../src/app/page.tsx",import.meta.url),"utf8");
 assert.ok(!page.includes("OPENAI_API_KEY"));
});
