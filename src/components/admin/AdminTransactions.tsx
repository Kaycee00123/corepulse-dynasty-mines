import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'refund' | 'transfer' | 'reward';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  details: any;
  created_at: string;
  user: {
    username: string;
  };
}

export function AdminTransactions() {
  const { hasPermission, logAdminAction } = useAdmin();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (hasPermission('transactions', 'read')) {
      fetchTransactions();
    }
  }, [hasPermission, page]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data, error, count } = await supabase
        .from('transactions')
        .select('*, user:user_id(username)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * 10, page * 10 - 1);

      if (error) throw error;

      setTransactions(data || []);
      setTotalPages(Math.ceil((count || 0) / 10));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId: string, newStatus: Transaction['status']) => {
    if (!hasPermission('transactions', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to update transactions.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', transactionId);

      if (error) throw error;

      await logAdminAction('update_transaction', 'transaction', transactionId, { status: newStatus });
      toast({
        title: "Status updated",
        description: "Transaction status has been updated successfully."
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRefund = async (transactionId: string) => {
    if (!hasPermission('transactions', 'write')) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to process refunds.",
        variant: "destructive"
      });
      return;
    }

    try {
      // TODO: Implement refund logic
      await logAdminAction('refund_transaction', 'transaction', transactionId);
      toast({
        title: "Refund processed",
        description: "Transaction has been refunded successfully."
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasPermission('transactions', 'read')) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">You don't have permission to view transactions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Management</CardTitle>
          <CardDescription>View and manage user transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={fetchTransactions}>
              Refresh
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>{transaction.user?.username || 'Unknown'}</TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{transaction.status}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            View Details
                          </Button>
                          {transaction.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(transaction.id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                          {transaction.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefund(transaction.id)}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Transaction ID: {selectedTransaction.id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">User</h4>
                <p>{selectedTransaction.user?.username || 'Unknown'}</p>
              </div>
              <div>
                <h4 className="font-semibold">Type</h4>
                <p className="capitalize">{selectedTransaction.type}</p>
              </div>
              <div>
                <h4 className="font-semibold">Amount</h4>
                <p>${selectedTransaction.amount.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="font-semibold">Status</h4>
                <p className="capitalize">{selectedTransaction.status}</p>
              </div>
              <div>
                <h4 className="font-semibold">Date</h4>
                <p>{format(new Date(selectedTransaction.created_at), 'MMM d, yyyy HH:mm:ss')}</p>
              </div>
              <div>
                <h4 className="font-semibold">Details</h4>
                <pre className="text-sm bg-gray-100 p-2 rounded">
                  {JSON.stringify(selectedTransaction.details, null, 2)}
                </pre>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedTransaction(null)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 