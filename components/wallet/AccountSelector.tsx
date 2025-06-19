import React from "react"
```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, User, Settings, Plus } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Account {
  id: string;
  name: string;
  publicKey: string;
  balance: number;
  isActive: boolean;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccount: Account | null;
  onAccountSelect: (account: Account) => void;
  onAccountCreate: (name: string) => void;
  onAccountRename: (accountId: string, newName: string) => void;
  className?: string;
}

export default function AccountSelector({
  accounts,
  selectedAccount,
  onAccountSelect,
  onAccountCreate,
  onAccountRename,
  className
}: AccountSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [renamingAccountId, setRenamingAccountId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const handleAccountSelect = (account: Account) => {
    try {
      onAccountSelect(account);
      setIsDialogOpen(false);
      toast.success(`Switched to ${account.name}`);
    } catch (error) {
      toast.error('Failed to switch account');
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      setIsCreating(true);
      await onAccountCreate(newAccountName.trim());
      setNewAccountName('');
      toast.success('Account created successfully');
    } catch (error) {
      toast.error('Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameAccount = async () => {
    if (!renamingAccountId || !renameValue.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      await onAccountRename(renamingAccountId, renameValue.trim());
      setIsRenaming(false);
      setRenamingAccountId(null);
      setRenameValue('');
      toast.success('Account renamed successfully');
    } catch (error) {
      toast.error('Failed to rename account');
    }
  };

  const startRename = (account: Account) => {
    setRenamingAccountId(account.id);
    setRenameValue(account.name);
    setIsRenaming(true);
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  const truncatePublicKey = (publicKey: string) => {
    return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
  };

  return (
    <>
      <Card className={cn("bg-[#0F0F23] border-gray-800", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#9945FF]" />
              Account
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAccount ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{selectedAccount.name}</p>
                  <p className="text-gray-400 text-sm">
                    {truncatePublicKey(selectedAccount.publicKey)}
                  </p>
                </div>
                <Badge 
                  variant={selectedAccount.isActive ? "default" : "secondary"}
                  className={selectedAccount.isActive ? "bg-[#9945FF] text-white" : "bg-gray-700 text-gray-300"}
                >
                  {selectedAccount.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-gray-400 text-sm">Balance</span>
                <span className="text-white font-mono">
                  {formatBalance(selectedAccount.balance)} SOL
                </span>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Switch Account
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-3">No account selected</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
              >
                Select Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0F0F23] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Manage Accounts</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="select" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger 
                value="select" 
                className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white"
              >
                Select
              </TabsTrigger>
              <TabsTrigger 
                value="create" 
                className="data-[state=active]:bg-[#9945FF] data-[state=active]:text-white"
              >
                Create
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="select" className="space-y-3 mt-4">
              {accounts.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {accounts.map((account) => (
                    <Card 
                      key={account.id}
                      className={cn(
                        "cursor-pointer transition-colors border-gray-700 hover:border-[#9945FF]",
                        selectedAccount?.id === account.id && "border-[#9945FF] bg-[#9945FF]/10"
                      )}
                      onClick={() => handleAccountSelect(account)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium">{account.name}</p>
                              {account.isActive && (
                                <Badge className="bg-green-600 text-white text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs">
                              {truncatePublicKey(account.publicKey)}
                            </p>
                            <p className="text-gray-300 text-sm font-mono">
                              {formatBalance(account.balance)} SOL
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startRename(account);
                              }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">No accounts found</p>
                  <p className="text-gray-500 text-sm">Create your first account to get started</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="account-name" className="text-gray-300">
                  Account Name
                </Label>
                <Input
                  id="account-name"
                  placeholder="Enter account name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateAccount();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleCreateAccount}
                disabled={isCreating || !newAccountName.trim()}
                className="w-full bg-[#9945FF] hover:bg-[#8A3FEF] text-white disabled:opacity-50"
              >
                {isCreating ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent className="bg-[#0F0F23] border-gray-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-input" className="text-gray-300">
                New Name
              </Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameAccount();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRenaming(false)}
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameAccount}
                disabled={!renameValue.trim()}
                className="flex-1 bg-[#9945FF] hover:bg-[#8A3FEF] text-white"
              >
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```