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
    // this.state = { name: "", key: "", path: "", working: false };
    // using a stub
    // XXX JUST FOR DEV
    console.log("populating add sheetsfile for dev");
    this.state = {
      name: "A human readable name",
      key: "1aySa6njMLlXT39FHm5ikHCxoxHF-HY0JF76ERzTxm88",
      path: "some_area/a_project",
      working: false
    };
  }
  async onSubmit() {
    if (this.state.working) {
      return;
    }
    this.setState({ working: true });
    // we may want to do more validation here...
    let isvalid = this.state["name"] && this.state["key"] && this.state["path"];
    if (!isvalid) {
      toaster.warning(
        "The form has a missing or invalid field, please fix it first."
      );
      return;
    }
    toaster.notify("Fetching the Google Sheets Document...", { duration: 120 });
    let sheets_doc = await get_sheetsdoc(this.state["key"]);
    // console.log(sheets_doc);
    toaster.closeAll();
    toaster.success(`Successfully loaded data for "${this.state.name}"`);
    this.props.onComplete(this.state, sheets_doc);
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
              let key = url
                .slice(url.indexOf(pre_token) + pre_token.length)
                .split("/")[0];
              this.setState({ key });
            } catch (e) {}
          }}
          // value={this.state.key}
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
