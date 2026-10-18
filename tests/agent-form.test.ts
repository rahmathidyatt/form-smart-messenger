import test from 'node:test';
import assert from 'node:assert/strict';
import {agentFormSchema} from '../src/lib/agent-form';
const input={nameCode:'Rahmat Hidayat (ABCD)',email:'test@example.com',unit:'AKASIA',date:'2099-01-01',address:'Jalan Uji Blok A Nomor 1',maps:'-',task:'other',other:'Uji integrasi',owner:'YA',consent:true};
test('combined identity preserves existing gateway name and code contract',()=>{const result=agentFormSchema.parse(input);assert.equal(result.name,'Rahmat Hidayat');assert.equal(result.code,'ABCD');assert.equal(result.maps,'');assert.equal('nameCode' in result,false);});
test('combined identity requires explicit code and retains service validation',()=>{assert.equal(agentFormSchema.safeParse({...input,nameCode:'Rahmat Hidayat'}).success,false);assert.equal(agentFormSchema.safeParse({...input,other:''}).success,false);assert.equal(agentFormSchema.safeParse({...input,date:'2000-01-01'}).success,false);});
