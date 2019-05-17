import { Pane } from "evergreen-ui/esm/layers";
import { SideSheet } from "evergreen-ui/esm/side-sheet";
import { Paragraph, Text, Link, Heading } from "evergreen-ui/esm/typography";
import { Button } from "evergreen-ui/esm/Buttons";
import { TextInput, TextInputField } from "evergreen-ui/esm/text-input";
// prettier-ignore
import { Menu } from "evergreen-ui/esm/menu";
import { toaster } from "evergreen-ui/esm/toaster";

import { get_sheetsdoc } from "./get_sheetsdoc";

export default class CredEdit extends React.Component {
  constructor(props) {
    super(props);
    let { bucket = "", key_id = "", secret_access_key = "" } = props.cred || {};
    // let { bucket = "", key_id = "", secret_access_key = "" } = props.cred;
    this.state = { bucket, key_id, secret_access_key };
    // this.state = { bucket: "", key_id: "", secret_access_key: "" };
  }

  render() {
    let on_enter = e => {
      if (e.which === 13) {
        return this.props.onSubmit(this.state);
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
        <Heading size={600} marginBottom={8} textAlign="center" />
        <TextInputField
          placeholder="Your Access Key ID"
          label="AWS Access Key ID"
          onKeyPress={on_enter}
          onChange={e => this.setState({ key_id: e.target.value })}
          value={this.state.key_id}
        />
        <TextInputField
          placeholder="Your Secret Key"
          label="AWS Secret Access Key"
          onKeyPress={on_enter}
          onChange={e => this.setState({ secret_access_key: e.target.value })}
          value={this.state.secret_access_key}
        />
        <TextInputField
          placeholder="Some general bucket"
          label="S3 Bucket"
          onKeyPress={on_enter}
          onChange={e => this.setState({ bucket: e.target.value })}
          value={this.state.bucket}
        />

        <Button
          appearance="primary"
          iconBefore="lock"
          height="44"
          onClick={() => this.props.onSubmit(this.state)}
        >
          Set Credentials
        </Button>
      </Pane>
    );
  }
}
