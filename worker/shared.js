import {TRAITS} from './data.js';
export function surveyQuestions(s,exact=true){
 const fail=()=>{throw Error('설문 링크의 형식이나 선택한 문항이 올바르지 않아요.')};
 if(!s||s.v!==1||!Array.isArray(s.selected)||s.selected.length>3||!s.selected.length||new Set(s.selected).size!==s.selected.length||!s.chosen||Array.isArray(s.chosen)||typeof s.chosen!=='object'||!Array.isArray(s.custom)||s.custom.length>20)fail();
 const out=[];
 for(const t of s.selected){if(!Number.isInteger(t)||t<0||t>=30)fail();const qs=s.chosen[t];if(!Array.isArray(qs)||new Set(qs).size!==qs.length)fail();for(const q of [...qs].sort((a,b)=>a-b)){if(!Number.isInteger(q)||q<0||q>=30)fail();out.push({key:`${t}-${q}`,trait:TRAITS[t].name,question:TRAITS[t].questions[q]});}}
 if(Object.keys(s.chosen).some(k=>!s.selected.some(t=>String(t)===k)))fail();
 if(out.length>10||(exact&&out.length!==10))fail();
 s.custom.forEach((q,i)=>{if(typeof q!=='string'||!q.trim()||q.length>500)fail();out.push({key:`custom-${i}`,trait:'추가 질문',question:q});});return out;
}
export function validateSubmission(b){
 if(!b||typeof b.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.id))throw Error('제출 ID가 올바르지 않아요.');
 const questions=surveyQuestions(b.survey);
 if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>60)throw Error('이름을 60자 이내로 입력해 주세요.');
 const today=new Date(Date.now()+9*3600000).toISOString().slice(0,10);
 if(typeof b.birth!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.birth)||!Number.isFinite(Date.parse(b.birth))||new Date(b.birth).toISOString().slice(0,10)!==b.birth||b.birth>today||b.birth<'0001-01-01')throw Error('실제로 존재하는 미래가 아닌 생년월일을 입력해 주세요.');
 if(typeof b.phone!=='string'||b.phone.length>25||!/^\d{9,15}$/.test(b.phone.replace(/[\s()-]/g,'')))throw Error('전화번호를 확인해 주세요. 숫자 9~15자리가 필요해요.');
 for(const q of questions){const a=b.answers?.[q.key];if(typeof a!=='string'||!a.trim()||a.length>5000)throw Error('모든 답변을 공백이 아닌 5,000자 이내로 입력해 주세요.');q.answer=a;}
 return {id:b.id,name:b.name.trim(),birth:b.birth,phone:b.phone.replace(/[\s()-]/g,''),questions,submittedAt:new Date().toISOString()};
}
