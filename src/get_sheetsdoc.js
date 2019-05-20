// import regeneratorRuntime from "regenerator-runtime";
import { asyncForEach } from "./util";

export async function get_sheetsdoc(sheets_doc_key) {
  let result = {};
  try {
    await gapi.client.init({
      apiKey: process.env.GOOGLE_API_KEY
    });
    let sheets_arr = await gapi.client.request({
      path: `https://sheets.googleapis.com/v4/spreadsheets/${sheets_doc_key}?&fields=sheets.properties`
    });
    await asyncForEach(sheets_arr.result.sheets, async a_sheet => {
      let single_sheet_title = a_sheet["properties"]["title"];
      single_sheet_title = single_sheet_title;
      let sheet_data = await gapi.client.request({
        path: `https://sheets.googleapis.com/v4/spreadsheets/${sheets_doc_key}/values/${single_sheet_title}`
      });
      result[single_sheet_title] = objectify(sheet_data.result.values);
    });
    return result;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function objectify(values_arr) {
  let col_headers = values_arr.shift();
  return values_arr.map(row => {
    let obj = {};
    col_headers.forEach((head, i) => {
      let v = row[i];
      // this seems to be the way drive shaft handles this
      obj[head] = v === "" || v === undefined ? null : v;
    });
    return obj;
  });
}

// cleaner but not what driveshaft is doing as much
// row.forEach((v, i) => {
//   let head = col_headers[i];
//   obj[head] = v === "" ? null : v;
// });

// just for dev !
import fixture from "../fixtures/raai_index_2019.json";
// hacky fix for the encoding issue
fixture["Leader's List 2019 vs 2017"] =
  fixture["Leader\\x27s List 2019 vs 2017"];
delete fixture["Leader\\x27s List 2019 vs 2017"];
// usefull http://jsondiff.com/

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

  // let all_match = JSON.stringify(fixture) === JSON.stringify(result);
  //
  // if (all_match) {
  //   console.log("✅ THEY ALLLLLLLL MATCH");
  // } else {
  //   console.log("NOt allll :-) MATCH");
  // }
  // console.log(result);
}
