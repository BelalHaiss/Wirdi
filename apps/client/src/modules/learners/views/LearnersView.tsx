import { useMemo } from 'react';
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Loader2, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { StudentTableItem } from '@/modules/learners/components/student-table-item';
import { StudentMainInfoModal } from '@/modules/learners/components/student-main-info-modal';
import type { StudentMainInfoSubmitArgs } from '@/modules/learners/components/student-main-info-modal';
import type { LearnerDto } from '@wirdi/shared';
import { useLearnersViewModel } from '../viewmodels/learners.viewmodel';

export default function LearnersView() {
  const vm = useLearnersViewModel();

  const columns = useMemo<ColumnDef<LearnerDto>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'الاسم',
        enableSorting: true,
      },
      {
        id: 'timezone',
        accessorKey: 'timezone',
        header: 'المنطقة الزمنية',
        enableSorting: true,
      },
      {
        id: 'notes',
        accessorFn: (row) => row.contact.notes ?? '',
        header: 'ملاحظات',
        enableSorting: true,
      },
      {
        id: 'groupCount',
        accessorFn: (row) => row.groupCount ?? 0,
        header: 'عدد المجموعات',
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'الإجراءات',
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: vm.learners,
    columns,
    state: { sorting: vm.sorting },
    onSortingChange: vm.setSortingTable,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  if (vm.queryError) {
    return (
      <Alert alertType='ERROR'>
        <AlertDescription>{vm.queryError}</AlertDescription>
      </Alert>
    );
  }

  const handleCreateSubmit = async (args: StudentMainInfoSubmitArgs) => {
    if (args.mode !== 'create') return;
    await vm.submitCreate(args.data);
  };

  return (
    <div className='space-y-4'>
      <PageHeader
        title='الطلاب'
        description='إدارة قائمة الطلاب'
        actions={
          vm.canManageLearners ? (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                color='muted'
                className='gap-2'
                onClick={vm.handleExportLearners}
                disabled={vm.isExporting}
              >
                {vm.isExporting ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Download className='w-4 h-4' />
                )}
                تصدير CSV
              </Button>
              <Button onClick={vm.openCreateModal} className='gap-2'>
                <UserPlus className='w-4 h-4' />
                إضافة طالب
              </Button>
            </div>
          ) : null
        }
      />

      <SearchInput
        value={vm.searchQuery}
        onChange={vm.onSearchQueryChange}
        placeholder='بحث بالاسم فقط'
        className='w-full sm:max-w-md'
      />

      <Table className='rounded-lg border bg-card shadow-sm'>
        <TableHeader className='bg-muted/40'>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const isSortable = header.column.getCanSort();

                return (
                  <TableHead
                    key={header.id}
                    className='px-4 py-3 text-xs'
                    onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div
                      className={
                        isSortable
                          ? 'flex items-center gap-1 cursor-pointer select-none'
                          : 'flex items-center gap-1'
                      }
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {isSortable &&
                        (sorted === 'asc' ? (
                          <ArrowUp className='h-3.5 w-3.5 text-muted-foreground' />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className='h-3.5 w-3.5 text-muted-foreground' />
                        ) : (
                          <ArrowUpDown className='h-3.5 w-3.5 text-muted-foreground' />
                        ))}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {vm.isLoading ? (
            <TableRow>
              <TableCell colSpan={5}>
                <div className='flex items-center justify-center py-8 gap-2 text-muted-foreground'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  جاري التحميل...
                </div>
              </TableCell>
            </TableRow>
          ) : vm.learners.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <div className='flex flex-col items-center justify-center py-10 text-muted-foreground gap-2'>
                  <Users className='w-6 h-6 opacity-70' />
                  <span>{vm.searchQuery ? 'لا توجد نتائج مطابقة' : 'لا يوجد طلاب حالياً'}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table
              .getRowModel()
              .rows.map((row) => (
                <StudentTableItem
                  key={row.original.id}
                  learner={row.original}
                  showActions={vm.canManageLearners}
                  onClick={vm.openViewModal}
                  onEditSubmit={(data) => vm.updateLearner(row.original.id, data)}
                  onDeleteConfirm={() => vm.deleteLearner(row.original.id)}
                  isUpdating={vm.isUpdatingLearner}
                />
              ))
          )}
        </TableBody>
      </Table>

      <PaginationControls
        value={vm.page}
        totalPages={vm.totalPages}
        onValueChange={vm.setPage}
        limit={vm.limit}
        onLimitChange={vm.setLimit}
        disabled={vm.isLoading || vm.isRefreshing}
      />

      {/* View / Create modal */}
      <StudentMainInfoModal
        open={vm.isStudentModalOpen}
        onOpenChange={vm.setIsStudentModalOpen}
        mode={vm.studentModalMode}
        learner={vm.selectedLearner}
        onSubmit={vm.studentModalMode === 'create' ? handleCreateSubmit : undefined}
        isLoading={vm.isSubmittingCreate}
      />
    </div>
  );
}
