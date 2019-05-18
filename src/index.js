// may need this
// import "core-js/stable";
import "regenerator-runtime/runtime";
// import regeneratorRuntime from "regenerator-runtime";

// import React from "react";
// import ReactDOM from "react-dom";

// import Pane from "evergreen-ui/esm/pane";
import { Pane } from "evergreen-ui/esm/layers";
import { SideSheet } from "evergreen-ui/esm/side-sheet";
import { Paragraph, Text, Link, Heading } from "evergreen-ui/esm/typography";
import { Button } from "evergreen-ui/esm/Buttons";
import { TextInput, TextInputField } from "evergreen-ui/esm/text-input";
// prettier-ignore
import { Table, TableHead, TableHeaderCell, TextTableHeaderCell, SearchTableHeaderCell, TableBody, TableRow, TableCell, TextTableCell} from "evergreen-ui/esm/table";
import { Menu } from "evergreen-ui/esm/menu";
import { toaster } from "evergreen-ui/esm/toaster";
import { StackingOrder, Intent, Position } from "evergreen-ui/esm/constants";

import { Router, Route } from "react-enroute";

import { asyncForEach } from "./util";
import SheetsFileAdd from "./sf_add";
import CredEdit from "./cred_edit";
import { get_sheetsdoc } from "./get_sheetsdoc";

// -------------------------------------
// -------------------------------------
// just for dev and testing !
// import { test_get_sheetsdoc } from "./get_sheetsdoc";
// JUST FOR DEV
// need to load gapi first
// gapi.load("client", () => {
//   test_get_sheetsdoc();
// });

// https://docs.google.com/spreadsheets/d/1aySa6njMLlXT39FHm5ikHCxoxHF-HY0JF76ERzTxm88/edit#gid=2140363911
function get_cred_params() {
  let urlParams = new URLSearchParams(window.location.search);
  return {
    bucket: urlParams.get("bucket") || "",
    key_id: urlParams.get("key_id") || "",
    secret_access_key: urlParams.get("secret_access_key") || ""
  };
}

function set_cred_params(cred) {
  let urlParams = new URLSearchParams(window.location.search);
  urlParams.set("bucket", cred.bucket);
  urlParams.set("key_id", cred.key_id);
  urlParams.set("secret_access_key", cred.secret_access_key);
  window.location.search = urlParams.toString();
}

function has_all_cred(cred) {
  return cred["bucket"] && cred["key_id"] && cred["secret_access_key"];
}

function setup_s3(cred) {
  // console.log("get all files", cred);
  // if (has_all_cred(cred)) {
  AWS.config.credentials = {
    accessKeyId: cred.key_id,
    secretAccessKey: cred.secret_access_key,
    region: "us-west-2"
  };
  let s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: cred.bucket }
  });
  return s3;
}

async function get_files(s3) {
  // console.log("try it!!!!");
  // Prefix
  // s3.listObjects({ Delimiter: "/" })
  let res = await s3
    .listObjects()
    // .listObjects({ Delimiter: "", Prefix: "" })
    .promise()
    .catch(e => console.log("err", e));
  console.log(res);
  return res ? res["Contents"] : [];
  // }
}

function put_file(s3, Key, Body, Metadata) {
  let params = {
    Bucket: "na-data-sheetsstorm",
    Key,
    Body,
    Metadata,
    ContentType: "application/json"
  };
  return s3.putObject(params).promise();
}
// s3.getObject({Bucket: srcbucket, Key: srckey}

// s3.listObjects({ Delimiter: "/" }, function(err, data) {
//   console.log(err, data);
// });

// http://localhost:1234/?bucket=cow
//  urlParams = new URLSearchParams(window.location.search).get("bucket")

// console.log(process.env.GOOGLE_API_KEY);
class App extends React.Component {
  constructor(props) {
    super(props);
    let cred = get_cred_params();
    this.sheetsInitialLoadComplete = this.sheetsInitialLoadComplete.bind(this);
    this.credSubmit = this.credSubmit.bind(this);
    let show_cred = !has_all_cred(cred);
    this.state = { show_sf_add: false, show_cred, cred };
  }
  async componentDidMount() {
    // need to make a role ... maybe
    // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html

    // check if they have all the creds first, TODO add back
    this.s3 = setup_s3(this.state.cred);
    get_files(this.s3).then(file_list => {
      this.setState({ file_list });
      console.log(file_list);
    });
  }
  async sheetsInitialLoadComplete(info, sheets_doc) {
    console.log("sheetsInitialLoadComplete");
    console.log(info, sheets_doc);
    this.setState({ show_sf_add: false });
    toaster.notify("Uploading To S3...", { duration: 120 });

    // name, key, path - in info
    let meta = { name: info.name, from: "abcdef" };
    let path = `${info.path}.json`;
    let body = JSON.stringify(sheets_doc);
    let r = await put_file(this.s3, path, body, meta);
    toaster.closeAll();
    toaster.success("Done with upload to S3!");
    console.log(r);
  }
  credSubmit(cred) {
    console.log("cred submit", cred);
    this.setState({ cred });
    this.s3 = setup_s3(this.state.cred);
    // make this optional
    // set_cred_params(cred);
  }
  render() {
    let full_cred_flag = has_all_cred(this.state.cred);
    return (
      <Pane display="flex" flexDirection="column">
        <SideSheet
          position={Position.TOP}
          isShown={this.state.show_sf_add}
          onCloseComplete={() => this.setState({ show_sf_add: false })}
        >
          <SheetsFileAdd onComplete={this.sheetsInitialLoadComplete} />
        </SideSheet>
        <SideSheet
          position={Position.BOTTOM}
          isShown={this.state.show_cred}
          onCloseComplete={() => this.setState({ show_cred: false })}
        >
          <CredEdit onSubmit={this.credSubmit} cred={this.state.cred} />
        </SideSheet>
        <Pane fontFamily="Patua One" fontSize={60} textAlign="center">
          ⛈ SheetsStorm
        </Pane>
        <Button
          appearance="primary"
          iconBefore="plus"
          height="44"
          marginTop={16}
          onClick={() => this.setState({ show_sf_add: true })}
        >
          Add a new Google Sheets Document
        </Button>
        <Button
          marginTop={16}
          appearance={full_cred_flag ? "default" : "primary"}
          iconBefore="lock"
          height="44"
          onClick={() => this.setState({ show_cred: true })}
        >
          {full_cred_flag ? "Edit" : "Add"} AWS Credentials & Bucket
        </Button>
        <Pane>
          {full_cred_flag ? <ExistingEntries cred={this.state.cred} /> : ``}
        </Pane>
        <Button>
          Hello {this.state.file_list ? this.state.file_list.length : ""}
        </Button>
        {/*<SheetsFileAdd onComplete={this.sheetsInitialLoadComplete} />*/}
      </Pane>
    );
  }
}

class ExistingEntries extends React.Component {
  render() {
    return <Pane>wefwef</Pane>;
  }
}

gapi.load("client", () => {
  // console.log("l");
  var mountNode = document.getElementById("app");
  ReactDOM.render(<App name="Zzz" />, mountNode);
});
