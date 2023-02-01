import { useRouter } from "next/router";
import { Box } from "@mui/material";
import { Button, TextField } from "shared";
import { useWorkspace } from "../../../context/Workspace";
import { BaseModal } from "../BaseModal";
import { pythonServerUrlParams } from "../../../lib/pythonClient";

type Props = {
  open: boolean;
  onClose: VoidFunction;
};

export const KeysModal = ({ open, onClose }: Props) => {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Keys"
      actions={
        <Button variant="text" onClick={onClose}>
          Close
        </Button>
      }
    >
      {/* <TextField
        id="accountName"
        label="Account Name"
        placeholder="e.g. Funding"
        error={errors.name?.message}
        autoFocus
        {...register("name")}
      /> */}
    </BaseModal>
  );
};
