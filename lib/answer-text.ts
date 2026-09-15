// Keep link targets and citation identifiers unchanged while cleaning prose.
export function cleanAnswerText(text:string):string {
 return text.split(/(https?:\/\/[^\s]+|\[[a-z0-9-]+\])/g).map((part,index)=>index%2?part:part
  .replace(/^[ \t]*(?:-{2,}|[—–]+)[ \t]*$/gm,'')
  .replace(/[ \t]*–[ \t]*/g,' to ')
  .replace(/[ \t]*(?:-{2,}|—+)[ \t]*/g,', ')
 ).join('');
}
