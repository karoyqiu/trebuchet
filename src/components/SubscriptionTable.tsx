import {
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  TableColumnDefinition,
  createTableColumn,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DeleteFilled } from '@fluentui/react-icons';
import { useLiveQuery } from 'dexie-react-hooks';
import React from 'react';
import db from '../db';
import { Subscription } from '../db/subscription';

type SubscriptionTableProps = {
  className?: string;
};

const useStyle = makeStyles({
  table: {},
  errorButton: {
    color: tokens.colorPaletteRedForeground3,
    ':hover': {
      color: tokens.colorPaletteRedForeground2,
    },
  },
});

export default function SubscriptionTable(props: SubscriptionTableProps) {
  const { className } = props;
  const items = useLiveQuery(() => db.subs.toArray(), []);
  const classes = useStyle();
  const columns = React.useMemo<TableColumnDefinition<Subscription>[]>(
    () => [
      createTableColumn({
        columnId: 'name',
        compare: (a, b) => a.name.localeCompare(b.name),
        renderHeaderCell: () => 'Name',
        renderCell: (item) => item.name,
      }),
      createTableColumn({
        columnId: 'url',
        compare: (a, b) => a.url.localeCompare(b.url),
        renderHeaderCell: () => 'URL',
        renderCell: (item) => item.url,
      }),
      createTableColumn({
        columnId: 'actions',
        renderHeaderCell: () => 'Actions',
        renderCell: () => (
          <Button
            className={classes.errorButton}
            icon={<DeleteFilled className={classes.errorButton} />}
            appearance="subtle"
          />
        ),
      }),
    ],
    []
  );

  return (
    <DataGrid
      className={className}
      items={items ?? []}
      columns={columns}
      getRowId={(item: Subscription) => item.id!}
    >
      <DataGridHeader>
        <DataGridRow>
          {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
        </DataGridRow>
      </DataGridHeader>
      <DataGridBody<Subscription>>
        {({ item, rowId }) => (
          <DataGridRow<Subscription> key={rowId}>
            {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
          </DataGridRow>
        )}
      </DataGridBody>
    </DataGrid>
  );
}
