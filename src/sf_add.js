import { Pane } from "evergreen-ui/esm/layers";
import { SideSheet } from "evergreen-ui/esm/side-sheet";
import { Paragraph, Text, Link, Heading } from "evergreen-ui/esm/typography";
import { Button } from "evergreen-ui/esm/Buttons";
import { TextInput, TextInputField } from "evergreen-ui/esm/text-input";
// prettier-ignore
import { Menu } from "evergreen-ui/esm/menu";
import { toaster } from "evergreen-ui/esm/toaster";

import { get_sheetsdoc } from "./get_sheetsdoc";

export default class SheetsFileAdd extends React.Component {
  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = { name: "", sheets_key: "", path: "", working: false };
    // XXX JUST FOR DEV
    // console.log("populating add sheetsfile for dev");
    // this.state = { name: "A human readable name", sheets_key: "1aySa6njMLlXT39FHm5ikHCxoxHF-HY0JF76ERzTxm88", path: "some_area/a_project", working: false };
  }
  async onSubmit() {
    if (this.state.working) {
      return;
    }
    // we may want to do more validation here...
    let { name, sheets_key, path } = this.state;
    path = path.trim();
    let is_valid = name.length && sheets_key.length && path.length;
    is_valid = is_valid && !path.includes(" ");
    if (!is_valid) {
      toaster.closeAll();
      // prettier-ignore
      toaster.warning("The form has a missing or invalid field, please fix it first.");
      return;
    }
    // a quick way to go from `prod/somearea/someproj.json` to `somearea/someproj`
    let { file_list } = this.props;
    let existing_paths = file_list.map(p => p.Key.slice(5).slice(0, -5));
    if (existing_paths.includes(path)) {
      toaster.closeAll();
      // prettier-ignore
      toaster.warning("A File with that path already exists! You can't add it again, but you can go update it.");
      return;
    }
    if (
      path.includes("archive/") ||
      path.includes("prod/") ||
      path.includes(".json")
    ) {
      toaster.closeAll();
      // prettier-ignore
      toaster.warning("Path contains blacklisted string, try again please");
      return;
    }
    this.setState({ working: true });
    toaster.notify("Fetching the Google Sheets Document...", { duration: 120 });
    let sheets_doc = await get_sheetsdoc(this.state["sheets_key"]);
    if (!sheets_doc) {
      toaster.closeAll();
      // prettier-ignore
      toaster.warning("There was a problem getting the file from Google Sheets. Please check the url and make sure it's set to public.");
      this.setState({ working: false });
      return;
    }
    // console.log(sheets_doc);
    toaster.closeAll();
    toaster.success(`Successfully loaded data for "${this.state.name}"`);
    this.props.onComplete({ name, sheets_key, path }, sheets_doc);
    // this.props.onComplete(this.state, sheets_doc);
  }
  render() {
    let on_enter = e => {
      if (e.which == 13) {
        return this.onSubmit();
      }
      return true;
    };
    return (
      <Pane
        display="flex"
        flexDirection="column"
        border
        padding={32}
        margin={16}
      >
        <Heading size={600} marginBottom={8} textAlign="center">
          Add Sheet
        </Heading>
        <TextInputField
          placeholder="Some Project"
          label="Name"
          onKeyPress={on_enter}
          onChange={e => this.setState({ name: e.target.value })}
          value={this.state.name}
          disabled={this.state.working}
        />
        <TextInputField
          placeholder="program_id/project_id"
          label="Path/ID"
          onKeyPress={on_enter}
          onChange={e => this.setState({ path: e.target.value })}
          value={this.state.path}
          disabled={this.state.working}
        />
        <TextInputField
          placeholder="Google Sheets URL"
          onKeyPress={on_enter}
          disabled={this.state.working}
          label="Google Sheets Document URL"
          onChange={e => {
            let url = e.target.value;
            let pre_token = "/spreadsheets/d/";
            try {
              let sheets_key = url
                .slice(url.indexOf(pre_token) + pre_token.length)
                .split("/")[0];
              this.setState({ sheets_key });
            } catch (e) {}
          }}
          // value={this.state.sheets_key}
        />
        <Button
          appearance="primary"
          iconBefore="plus"
          height="44"
          onClick={this.onSubmit}
          disabled={this.state.working}
        >
          Add Document From Drive & Push to S3
        </Button>
      </Pane>
    );
  }
}
