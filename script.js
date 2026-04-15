let pageWiseText = [];
let allVisuals = [];

/* ================= PROCESS ================= */

async function processInput(){

document.getElementById("output").innerHTML="";
document.getElementById("loader").classList.remove("hidden");

let files = document.getElementById("fileInput").files;

pageWiseText = [];
allVisuals = [];

for(let file of files){
if(file && file.type.includes("pdf")){
await processPDF(file);
}
}

document.getElementById("loader").classList.add("hidden");

displayPageSummaries();
displayVisualInsights();
generateFinalSummary();
}

/* ================= PDF ================= */

async function processPDF(file){

let pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;

for(let i=1;i<=pdf.numPages;i++){

let page = await pdf.getPage(i);
let content = await page.getTextContent();

let textItems = content.items.sort((a,b)=>{
return b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4];
});

let rawText = textItems.map(item=>item.str).join(" ");
let text = cleanText(rawText);

pageWiseText.push({page:i, text});

/* 🔥 NEW VISUAL LOGIC */
extractVisuals(text, i);
}
}

/* ================= CLEAN TEXT ================= */

function cleanText(text){

return text
.replace(/\s+/g," ")
.replace(/authorized.*?ieee.*?apply/gi,"")
.replace(/[\[\]\(\)]/g,"")
.replace(/\s+/g," ")
.trim();
}

/* ================= FINAL VISUAL FIX ================= */

function extractVisuals(text, page){

/* SUPPORT ALL FORMATS */
let regex = /(fig\.?|figure|table)\s*[,.:]?\s*([ivx\d]+)/gi;

let matches = [...text.matchAll(regex)];

matches.forEach(match => {

let typeRaw = match[1].toLowerCase();
let numberRaw = match[2].toLowerCase();

let type = typeRaw.includes("table") ? "Table" : "Figure";

/* 🔥 UNIQUE KEY */
let key = type + "_" + numberRaw;

/* 🔥 REMOVE DUPLICATES */
if(allVisuals.some(v => v.key === key)) return;

/* 🔥 GET NEXT TEXT AS CAPTION */
let afterText = text.slice(match.index + match[0].length);

/* TAKE NEXT LINE / SENTENCE */
let caption = afterText.split(".")[0].trim();

/* CLEAN */
caption = caption.replace(/[^a-zA-Z0-9 ,\-]/g,"");
caption = caption.split(" ").slice(0,20).join(" ");

if(caption.length < 10){
caption = type + " " + numberRaw;
}

/* DESCRIPTION */
let desc = smartVisualDesc(caption);

allVisuals.push({
key,
page,
number: numberRaw,
type,
caption,
desc
});

});
}

/* ================= VISUAL DESC ================= */

function smartVisualDesc(text){

text = text.toLowerCase();

if(text.includes("architecture") || text.includes("flow")){
return "This figure explains the system architecture and workflow.";
}

if(text.includes("bleu")){
return "This table compares BLEU scores of different models.";
}

if(text.includes("distribution") || text.includes("plot")){
return "This figure shows a frequency distribution of data patterns.";
}

if(text.includes("output") || text.includes("result")){
return "This figure presents system output or results.";
}

return "This visual represents important system information.";
}

/* ================= PAGE SUMMARY ================= */

function displayPageSummaries(){

let html = "<h2>📄 Page-wise Cognitive Summary</h2>";

pageWiseText.forEach(p => {

let summary = generatePageSummary(p.text);

html += `
<div class="page">
<b>Page ${p.page}</b><br>
${summary}
</div>
`;
});

document.getElementById("output").innerHTML = html;
}

/* ================= SMART PAGE SUMMARY ================= */

function generatePageSummary(text){

let sentences = text.match(/[^.]+./g) || [];

sentences = sentences.filter(s => s.length > 40);

let selected = sentences.slice(0,6);

let lower = text.toLowerCase();

let intro = "";

if(lower.includes("abstract")){
intro = "This page presents the overview and objective of the research paper. ";
}
else if(lower.includes("introduction")){
intro = "This page introduces the problem and background. ";
}
else if(lower.includes("method")){
intro = "This page explains the methodology and working process. ";
}
else if(lower.includes("result")){
intro = "This page discusses results and evaluation. ";
}
else if(lower.includes("conclusion")){
intro = "This page summarizes conclusions and future scope. ";
}
else{
intro = "This page explains important technical concepts. ";
}

return intro + selected.join(" ");
}

/* ================= VISUAL DISPLAY ================= */

function displayVisualInsights(){

let html = "<h2>📊 Visual Insights</h2>";

if(allVisuals.length === 0){
html += "<p>No visuals detected.</p>";
document.getElementById("output").innerHTML += html;
return;
}

allVisuals.sort((a,b)=>a.page - b.page);

allVisuals.forEach(v=>{
html += `
<div class="visual-card">
<div class="visual-title">${v.type} (${v.number})</div>
<div class="visual-page">📄 Page ${v.page}</div>
<div class="visual-caption">${v.caption}</div>
<div class="visual-desc">${v.desc}</div>
</div>
`;
});

document.getElementById("output").innerHTML += html;
}

/* ================= FINAL SUMMARY ================= */

function generateFinalSummary(){

let combined = pageWiseText.map(p=>p.text).join(" ");

let sections = {
Overview: combined.slice(0,1500),
Methodology: combined.slice(1500,3000),
Results: combined.slice(3000,4500),
Conclusion: combined.slice(4500,6000)
};

let html = "<h2>🧠 Final Cognitive Summary</h2>";

for(let key in sections){
html += `
<div class="section">
<h3>${key}</h3>
<p>${generatePageSummary(sections[key])}</p>
</div>`;
}

document.getElementById("output").innerHTML += html;
}

/* ================= CLEAR ================= */

function clearAll(){
location.reload();
}