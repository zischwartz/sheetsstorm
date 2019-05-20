// import "core-js/stable";
import "regenerator-runtime/runtime";
// import regeneratorRuntime from "regenerator-runtime";
// import React from "react";
// import ReactDOM from "react-dom";

import { Pane } from "evergreen-ui/esm/layers";
import { SideSheet } from "evergreen-ui/esm/side-sheet";
// prettier-ignore
import { Text, Link, Heading, Code, Pre, Strong} from "evergreen-ui/esm/typography";
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
// prettier-ignore
import { asyncForEach, get_cred_params,  set_cred_params,  has_all_cred,  setup_s3,  get_files,  put_file,  to_human_date} from "./util";
import SheetsFileAdd from "./sf_add";
import CredEdit from "./cred_edit";
import SingleFile from "./single_file";
import { get_sheetsdoc } from "./get_sheetsdoc";

class App extends React.Component {
  constructor(props) {
    super(props);
    let cred = get_cred_params();
    this.putSheetsDataToS3 = this.putSheetsDataToS3.bind(this);
    this.credSubmit = this.credSubmit.bind(this);
    let show_cred = !has_all_cred(cred);
    this.state = { show_sf_add: false, show_cred, cred, selected: false };
    // e.g. / debug
    // this.state = { show_sf_add: false, show_cred, cred, selected: "prod/some_area/a_project.json" };
  }
  // pass this in so we can count on it being up to date, as setstate isn't syncronous
  load_files(cred) {
    if (has_all_cred(cred)) {
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
    // console.log("putSheetsDataToS3");
    // console.log(info, sheets_doc);
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
  }
  credSubmit(cred) {
    // console.log("cred submit", cred);
    this.setState({ cred });
    this.s3 = setup_s3(cred);
    this.load_files(cred);
    // update the url with settings if they're ok with it
    if (cred.update_url) {
      set_cred_params(cred);
    }
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
          <SheetsFileAdd
            onComplete={this.putSheetsDataToS3}
            file_list={this.state.file_list}
          />
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
              cred={this.state.cred}
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
            this.setState({ selected: path });
          }}
        />
      </Pane>
    );
  }
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
              <Text size={300}>{modified}</Text>

              <Heading size={500}>{human_path}</Heading>
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

// XXX this is what actually starts it, as we can't do much until it's

gapi.load("client", () => {
  // console.log("l");
  var mountNode = document.getElementById("app");
  ReactDOM.render(<App />, mountNode);
});

// -------------------------------------
// -------------------------------------
// just for dev and testing !
// import { test_get_sheetsdoc } from "./get_sheetsdoc";
// JUST FOR DEV
// need to load gapi first
// gapi.load("client", () => {
//   test_get_sheetsdoc();
// });
