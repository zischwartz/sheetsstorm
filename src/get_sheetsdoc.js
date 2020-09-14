// import regeneratorRuntime from "regenerator-runtime";
import { asyncForEach } from "./util";

export async function get_sheetsdoc(sheets_doc_key) {
  let result = {};
  try {
    await gapi.client.init({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    let sheets_arr = await gapi.client.request({
      path: `https://sheets.googleapis.com/v4/spreadsheets/${sheets_doc_key}?&fields=sheets.properties`,
    });
    await asyncForEach(sheets_arr.result.sheets, async (a_sheet) => {
      let single_sheet_title = a_sheet["properties"]["title"];
      let enc_single_sheet_title = encodeURIComponent(single_sheet_title);
      // console.log(single_sheet_title);
      let sheet_data = await gapi.client.request({
        path: `https://sheets.googleapis.com/v4/spreadsheets/${sheets_doc_key}/values/${enc_single_sheet_title}`,
      });
      // console.log("---");
      // console.log(single_sheet_title);
      // console.log(sheet_data);
      result[single_sheet_title] = sheet_data.result.values
        ? objectify(sheet_data.result.values)
        : [];
      // console.log(result[single_sheet_title]);
    });
    return result;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function objectify(values_arr) {
  try {
    let col_headers = values_arr.shift();
    return values_arr.map((row) => {
      let obj = {};
      col_headers.forEach((head, i) => {
        let v = row[i];
        // this seems to be the way drive shaft handles this
        obj[head] = v === "" || v === undefined ? null : v;
      });
      return obj;
    });
  } catch (e) {
    console.log(e);
    // console.log("values_arr");
    // console.log(values_arr);
    return [];
  }
}

// similar to above but gets csvs and an array
export async function get_sheetsdoc_csvs(sheets_doc_key) {
  let result = [];
  try {
    await gapi.client.init({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    let sheets_arr = await gapi.client.request({
      path: `https://sheets.googleapis.com/v4/spreadsheets/${sheets_doc_key}?&fields=sheets.properties`,
    });
    await asyncForEach(sheets_arr.result.sheets, async (a_sheet) => {
      let single_sheet_title = a_sheet["properties"]["title"];
      let enc_single_sheet_title = encodeURIComponent(single_sheet_title);
      // console.log("title", single_sheet_title);
      let sheet_id = a_sheet["properties"]["sheetId"].toString();
      // https://stackoverflow.com/a/33727897/83859
      let url = `https://docs.google.com/spreadsheets/d/${sheets_doc_key}/gviz/tq?tqx=out:csv&sheet=${enc_single_sheet_title}`;
      let resp = await fetch(url, { mode: "cors" });
      let text = await resp.text();
      // console.log(text);
      // console.log("\n\n");
      result.push({ sheet_id, text, single_sheet_title, sheets_doc_key });
      // result[sheet_id] = text;
      // console.log(text);
    });
  } catch (e) {
    console.log(e);
    return false;
  }
  return result;
  // https://docs.google.com/spreadsheets/d/{key}/gviz/tq?tqx=out:csv&sheet={sheet_name}
}

// a newer test, more complicated tabsheet titles, escaping, also just for dev
// gapi.load("client", async () => {
//   // let result = await get_sheetsdoc(
//   let result = await get_sheetsdoc_csvs(
//     "1xa0iLqYKz8x9Yc_rfhtmSOJQ2EGgeUVjvV4A8LsIaxY"
//   );
//   console.log(result);
// });

// JUST FOR DEV
// uncomment this to run the test above
// need to load gapi first
// gapi.load("client", () => {
//   test_get_sheetsdoc();
// });

// just for dev !
import fixture from "../fixtures/raai_index_2019.json";
// hacky fix for the encoding issue
fixture["Leader's List 2019 vs 2017"] =
  fixture["Leader\\x27s List 2019 vs 2017"];
delete fixture["Leader\\x27s List 2019 vs 2017"];
// usefull http://jsondiff.com/

// Note, this make shift test only gets 7/11 of the tables for the test document,
// which seems to be character encoding issues (as in the fixture key above), exacerbated by a complicated test case
export async function test_get_sheetsdoc() {
  console.log("running transform test");
  console.log(" against fixture:");
  console.log(fixture);
  // let fixture_string = JSON.stringify(fixture);
  // console.log(fixture_string.split("\x27").length);
  // console.log(fixture_string.split(`\x26`).length);
  // return;
  // Zach Ref Copy of RAAI live data template 2019
  // https://docs.google.com/spreadsheets/d/1aySa6njMLlXT39FHm5ikHCxoxHF-HY0JF76ERzTxm88/edit#gid=2140363911
  let result = await get_sheetsdoc(
    "1aySa6njMLlXT39FHm5ikHCxoxHF-HY0JF76ERzTxm88"
  );

  let keys = Object.keys(fixture);
  let score = 0;
  console.log("using fixture keys");
  // console.log('using results keys')
  // let keys = Object.keys(result);
  for (let k of keys) {
    console.log(`Checking ${k}`);

    let they_match = JSON.stringify(fixture[k]) === JSON.stringify(result[k]);
    if (!result[k]) {
      console.log("mismatch! not found at all");
    } else if (they_match) {
      console.log("✅ THEY MATCH");
      score += 1;
    } else {
      console.log(`fixture is ${JSON.stringify(fixture[k]).length} c long `);
      console.log(`result is ${JSON.stringify(result[k]).length} c long `);
      console.log(`fixture is ${fixture[k].length} rows long `);
      console.log(`result is ${result[k].length} rows long `);
      console.log("NO MATCH");
    }
    console.log(" ");
  }

  console.log(`Score: ${score} (/${keys.length})`);
}
