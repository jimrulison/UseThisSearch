import React, { useState } from 'react';
import { Building2, Plus, Settings, ChevronDown, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useCompany } from '../contexts/CompanyContext';
import { useToast } from '../hooks/use-toast';

const CompanySelector = () => {
  const { 
    companies, 
    activeCompany, 
    switchCompany, 
    createCompany, 
    updateCompany, 
    deleteCompany,
    isLoading 
  } = useCompany();
  
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;
    
    setIsSubmitting(true);
    const result = await createCompany(newCompanyName.trim());
    
    if (result.success) {
      toast({
        title: "Company Created",
        description: `"${result.company.name}" has been created successfully.`,
        duration: 3000,
      });
      setNewCompanyName('');
      setIsCreateDialogOpen(false);
      // Automatically switch to the new company
      switchCompany(result.company);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
        duration: 5000,
      });
    }
    setIsSubmitting(false);
  };

  const handleEditCompany = async () => {
    if (!newCompanyName.trim() || !editingCompany) return;
    
    setIsSubmitting(true);
    const result = await updateCompany(editingCompany.id, newCompanyName.trim());
    
    if (result.success) {
      toast({
        title: "Company Updated",
        description: `Company renamed to "${result.company.name}".`,
        duration: 3000,
      });
      setNewCompanyName('');
      setIsEditDialogOpen(false);
      setEditingCompany(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
        duration: 5000,
      });
    }
    setIsSubmitting(false);
  };

  const handleDeleteCompany = async (company) => {
    if (company.is_personal) {
      toast({
        title: "Cannot Delete",
        description: "Personal company cannot be deleted.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const result = await deleteCompany(company.id);
    
    if (result.success) {
      toast({
        title: "Company Deleted",
        description: `"${company.name}" has been deleted.`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const openEditDialog = (company) => {
    setEditingCompany(company);
    setNewCompanyName(company.name);
    setIsEditDialogOpen(true);
  };

  if (isLoading || !activeCompany) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <Building2 className="h-4 w-4 text-gray-400" />
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 min-w-[160px] justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium truncate max-w-[100px]">
                {activeCompany.name}
              </span>
              {activeCompany.is_personal && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Personal
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
          
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => switchCompany(company)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="truncate max-w-[120px]">{company.name}</span>
                {company.is_personal && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Personal
                  </Badge>
                )}
              </div>
              {activeCompany.id === company.id && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setIsCreateDialogOpen(true)}
            className="cursor-pointer text-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Company
          </DropdownMenuItem>
          
          {!activeCompany.is_personal && (
            <>
              <DropdownMenuItem
                onClick={() => openEditDialog(activeCompany)}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit "{activeCompany.name}"
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Company Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Create a new company to organize your keyword research and content creation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                placeholder="Enter company name..."
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) {
                    handleCreateCompany();
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewCompanyName('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCompany}
              disabled={!newCompanyName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update the name of "{editingCompany?.name}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">Company Name</Label>
              <Input
                id="edit-company-name"
                placeholder="Enter company name..."
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting) {
                    handleEditCompany();
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setNewCompanyName('');
                setEditingCompany(null);
              }}
            >
              Cancel
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => {
                handleDeleteCompany(editingCompany);
                setIsEditDialogOpen(false);
                setNewCompanyName('');
                setEditingCompany(null);
              }}
              className="mr-2"
            >
              Delete Company
            </Button>
            
            <Button 
              onClick={handleEditCompany}
              disabled={!newCompanyName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompanySelector;