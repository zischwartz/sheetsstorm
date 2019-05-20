// may need this
// import "core-js/stable";
import "regenerator-runtime/runtime";
// import regeneratorRuntime from "regenerator-runtime";

// import React from "react";
// import ReactDOM from "react-dom";

// import Pane from "evergreen-ui/esm/pane";
import { Pane } from "evergreen-ui/esm/layers";
import { SideSheet } from "evergreen-ui/esm/side-sheet";
import {
  Text,
  Link,
  Heading,
  Code,
  Pre,
  Strong
} from "evergreen-ui/esm/typography";
import { Button } from "evergreen-ui/esm/Buttons";
import { TextInput, TextInputField } from "evergreen-ui/esm/text-input";
// prettier-ignore
import { Table, TableHead, TableHeaderCell, TextTableHeaderCell, SearchTableHeaderCell, TableBody, TableRow, TableCell, TextTableCell} from "evergreen-ui/esm/table";
import { Menu } from "evergreen-ui/esm/menu";
import { toaster } from "evergreen-ui/esm/toaster";

import { Spinner } from "evergreen-ui/esm/spinner";
import { StackingOrder, Intent, Position } from "evergreen-ui/esm/constants";
import { Badge, Pill } from "evergreen-ui/esm/badges";

import { Router, Route } from "react-enroute";

import {
  asyncForEach,
  get_cred_params,
  set_cred_params,
  has_all_cred
} from "./util";
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

function setup_s3(cred) {
  // console.log("get all files", cred);
  // if (!has_all_cred(cred)) {
  //   return false;
  // }
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

async function get_files(s3, Prefix = "") {
  // s3.listObjects({ Delimiter: "/" })
  let res = await s3.listObjects({ Delimiter: "", Prefix }).promise();
  // .catch(e => console.log("err", e));
  // console.log(res);
  return res ? res["Contents"] : [];
}

function put_file(s3, Key, Body, Metadata) {
  let params = {
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
    this.putSheetsDataToS3 = this.putSheetsDataToS3.bind(this);
    this.credSubmit = this.credSubmit.bind(this);
    let show_cred = !has_all_cred(cred);
    this.state = { show_sf_add: false, show_cred, cred, selected: false };
    // e.g. / debug
    // this.state = {
    //   show_sf_add: false,
    //   show_cred,
    //   cred,
    //   selected: "prod/some_area/a_project.json"
    // };
  }
  // pass this in so we can count on it being up to date, as setstate isn't syncronous
  load_files(cred) {
    // console.log(this.state);
    // console.log(has_all_cred);
    // console.log("a", has_all_cred(this.state.cred));
    if (has_all_cred(cred)) {
      // console.log("z");
      get_files(this.s3, "prod/")
        .then(file_list => {
          this.setState({ file_list, show_cred: false });
        })
        .catch(e => {
          toaster.danger(
            "There was a problem with your credentials! Please make sure you've got them right",
            { duration: 30 }
          );
        });
    }
  }
  async componentDidMount() {
    // need to make a role ... maybe
    // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html

    // check if they have all the creds first, TODO add back
    this.s3 = setup_s3(this.state.cred);
    this.load_files(this.state.cred);
  }
  async putSheetsDataToS3(info, sheets_doc) {
    console.log("putSheetsDataToS3");
    console.log(info, sheets_doc);
    this.setState({ show_sf_add: false });
    toaster.notify("Uploading To S3...", { duration: 120 });
    let now = new Date();
    now = `${now.valueOf()}`;
    // we'll use these later
    let meta = { name: info.name, from: now, sheets_key: info.sheets_key };
    let body = JSON.stringify(sheets_doc);
    await put_file(this.s3, `prod/${info.path}.json`, body, meta);
    await put_file(this.s3, `archive/${info.path}_${now}.json`, body, {});
    toaster.closeAll();
    toaster.success("Done with upload to S3!", { duration: 15 });
    // repull the list to update ui
    this.load_files(this.state.cred);
    // get_files(this.s3, "prod/").then(file_list => {
    //   this.setState({ file_list });
    // });
  }
  credSubmit(cred) {
    // console.log("cred submit", cred);
    this.setState({ cred });
    this.s3 = setup_s3(cred);
    // console.log(this.s3);
    this.load_files(cred);
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
          <SheetsFileAdd onComplete={this.putSheetsDataToS3} />
        </SideSheet>
        <SideSheet
          position={Position.BOTTOM}
          isShown={this.state.show_cred}
          onCloseComplete={() => this.setState({ show_cred: false })}
        >
          <CredEdit onSubmit={this.credSubmit} cred={this.state.cred} />
        </SideSheet>
        {!this.s3 ? (
          ``
        ) : (
          <SideSheet
            position={Position.LEFT}
            isShown={!!this.state.selected}
            onCloseComplete={() => this.setState({ selected: false })}
          >
            <SingleFile
              s3={this.s3}
              selected={this.state.selected}
              putSheetsDataToS3={this.putSheetsDataToS3}
            />
          </SideSheet>
        )}

        {/* TODO another sidesheet to edit and update them */}
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
        <ExistingEntries
          file_list={this.state.file_list}
          onEditClick={async path => {
            // console.log(path);
            this.setState({ selected: path });
            // let prod_file = await this.s3.getObject({ Key: path }).promise();

            // console.log(prod_file.Metadata);
            // console.log(prod_file);
            // console.log(JSON.parse(prod_file.Body.toString()));
          }}
        />
      </Pane>
    );
  }
}

class SingleFile extends React.Component {
  constructor(props) {
    super(props);
    this.revertTo = this.revertTo.bind(this);
    this.state = { meta: false, archive: false, overview: [] };
  }
  async addUpdate() {
    console.log(this.state);
    // console.log(this.state.meta.sheets_key);
    let { meta } = this.state;
    let { sheets_key } = meta;
    toaster.notify("Fetching the Google Sheets Document...", { duration: 120 });
    let sheets_doc = await get_sheetsdoc(sheets_key);
    toaster.closeAll();
    toaster.success(`Successfully Loaded Latest Sheets Data`);

    let path = this.props.selected.split(".json")[0].replace("prod/", "");
    let info = { name: meta.name, sheets_key, path };
    await this.props.putSheetsDataToS3(info, sheets_doc);
    await this.loadFileAndArchives();
  }
  async revertTo(path_of_archive) {
    toaster.notify("Reverting", { duration: 120 });

    let ts = /(\d+).json/g.exec(path_of_archive)[1];
    let { sheets_key, name } = this.state.meta;
    let archive_file = await this.props.s3
      .getObject({ Key: path_of_archive })
      .promise();
    let meta = { name, from: ts, sheets_key };
    await put_file(
      this.props.s3,
      this.props.selected,
      archive_file.Body.toString(),
      meta
    );
    await this.loadFileAndArchives();
    toaster.closeAll();
    toaster.success(`Successfully Reverted`);
  }
  async componentDidMount() {
    await this.loadFileAndArchives();
  }
  async loadFileAndArchives() {
    let prod_file = await this.props.s3
      .getObject({ Key: this.props.selected })
      .promise();
    let meta = prod_file.Metadata;
    // console.log("meta", meta);
    // this.setState({ meta });
    let search_path = this.props.selected
      .replace(".json", "")
      .replace("prod/", "archive/");
    // console.log("search_path:");
    // console.log(search_path);
    let archive = await this.props.s3
      .listObjects({ Delimiter: "", Prefix: search_path })
      .promise()
      .catch(e => console.log("err", e));
    archive = archive.Contents;

    let file_data_obj = JSON.parse(prod_file.Body.toString());
    let overview = Object.keys(file_data_obj).map(table_name => {
      let rows = file_data_obj[table_name].length;
      return { table_name, rows };
    });

    this.setState({ meta, archive, overview });
    // console.log(archive);

    // meta['']
    // console.log(prod_file.Metadata);
    // console.log(prod_file);
  }
  render() {
    return (
      <Pane padding={8} margin={8}>
        <Heading size={700} marginY={16}>
          {this.state.meta ? this.state.meta.name : ""}
        </Heading>
        <Heading marginY={16}>{this.props.selected}</Heading>
        <Button
          appearance="primary"
          width={"100%"}
          height={40}
          iconBefore="cloud-upload"
          marginBottom={32}
          onClick={() => this.addUpdate()}
        >
          Get Google Sheets Data and Upload New Version to S3
        </Button>
        <Heading marginY={16}>Archives</Heading>

        {!this.state.archive
          ? ``
          : this.state.archive.map((obj, i) => {
              // console.log(obj.Key);
              // console.log(obj.state.meta);
              // console.log(`${this.state.meta.from}.json`);
              let is_active = obj.Key.endsWith(`_${this.state.meta.from}.json`);
              return (
                <Pane
                  key={i}
                  background="tint2"
                  marginY={8}
                  padding={8}
                  display="flex"
                  justifyContent="space-between"
                >
                  <Text>
                    {" "}
                    {is_active ? "✅" : "⏹"} {to_human_date(obj.LastModified)}
                  </Text>
                  {!is_active ? (
                    <Button
                      iconBefore="undo"
                      onClick={() => this.revertTo(obj.Key)}
                    >
                      Revert To This Version
                    </Button>
                  ) : (
                    <Badge color="green">Active</Badge>
                  )}
                </Pane>
              );
            })}
        <Pane margin={16} padding={16} background="tint1">
          <Heading marginBottom={16}>Overview of Active File</Heading>

          {this.state.overview.map(({ table_name, rows }) => {
            return (
              <Pane
                key={table_name}
                display="flex"
                justifyContent="space-between"
                borderBottom
                marginBottom={2}
              >
                <Code>{table_name}</Code>
                <Text>{rows} rows</Text>
              </Pane>
            );
          })}
        </Pane>
      </Pane>
    );
  }
}

function to_human_date(date) {
  return `${date.toDateString()} at ${date.toLocaleTimeString()}`;
}

class ExistingEntries extends React.Component {
  render() {
    let { file_list } = this.props;

    let list_entries = !file_list
      ? ``
      : file_list.map(entry => {
          let human_path = entry.Key.split(".json")[0].replace("prod/", "");
          let modified = to_human_date(entry.LastModified);
          return (
            <Pane
              key={human_path}
              marginY={8}
              padding={8}
              background="tint1"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Heading size={500}>{human_path}</Heading>
              <Text size={300}>Last Modified: {modified}</Text>
              <Button
                iconBefore="edit"
                appearance="primary"
                intent="success"
                height={36}
                onClick={() => this.props.onEditClick(entry.Key)}
              >
                Edit/Update
              </Button>
            </Pane>
          );
        });
    return (
      <Pane padding={16} border marginTop={16} elevation={0}>
        <Heading marginBottom={16}>Your Files</Heading>
        {!file_list ? <Spinner marginX="auto" marginY={32} /> : ``}
        {file_list && file_list.length == 0 ? (
          <Text> No Files Yet. Add one above!</Text>
        ) : (
          ``
        )}
        {list_entries}
      </Pane>
    );
  }
}

gapi.load("client", () => {
  // console.log("l");
  var mountNode = document.getElementById("app");
  ReactDOM.render(<App />, mountNode);
});
