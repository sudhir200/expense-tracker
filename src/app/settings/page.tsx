'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFamily } from '@/hooks/useFamily';
import { getCurrencyList, Currency, EXCHANGE_RATES } from '@/lib/currency';
import { ExchangeRate, Income } from '@/types/income';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Plus, 
  Edit2, 
  Save, 
  X, 
  DollarSign, 
  TrendingUp, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe,
  Users,
  Key,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Camera,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { currency: currentCurrency, setCurrency } = useSettings();
  const { user } = useAuth();
  const { family } = useFamily();
  
  // Navigation state - check URL parameter for initial tab
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  
  // General settings state
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency.code);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    jobTitle: '',
  });
  
  // Family data for display only
  const [userFamilyInfo, setUserFamilyInfo] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Security state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // Notification state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    budgetAlerts: true,
    familyUpdates: true,
    expenseReminders: false,
  });
  
  // Exchange rates state
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState('');
  
  // Income state
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    currency: currentCurrency.code,
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    frequency: 'one-time' as const,
    isRecurring: false,
  });

  const currencies = getCurrencyList();

  // Settings tabs configuration
  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data & Export', icon: Download },
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchExchangeRates();
    fetchIncomes();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('/api/exchange-rates');
      if (response.ok) {
        const data = await response.json();
        setExchangeRates(data);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const fetchIncomes = async () => {
    try {
      const response = await fetch('/api/income?limit=10');
      if (response.ok) {
        const data = await response.json();
        setIncomes(data.income || []);
      }
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };

  const handleSave = () => {
    setCurrency(selectedCurrency);
    setIsSaved(true);
    // Hide the success message after 3 seconds
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Exchange rate handlers
  const handleEditRate = (rateId: string, currentRate: number) => {
    setEditingRate(rateId);
    setEditRateValue(currentRate.toString());
  };

  const handleSaveRate = async (fromCurrency: string, toCurrency: string) => {
    try {
      const response = await fetch('/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency,
          toCurrency,
          rate: parseFloat(editRateValue),
        }),
      });

      if (response.ok) {
        await fetchExchangeRates();
        setEditingRate(null);
        setEditRateValue('');
      }
    } catch (error) {
      console.error('Error saving exchange rate:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingRate(null);
    setEditRateValue('');
  };

  // Income handlers
  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomeForm),
      });

      if (response.ok) {
        await fetchIncomes();
        setIsIncomeModalOpen(false);
        setIncomeForm({
          amount: '',
          currency: currentCurrency.code,
          source: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          frequency: 'one-time',
          isRecurring: false,
        });
      }
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };

  const handleIncomeFormChange = (field: string, value: any) => {
    setIncomeForm(prev => ({ ...prev, [field]: value }));
  };

  // Load user data on component mount
  useEffect(() => {
    loadUserProfile();
    loadNotificationPreferences();
  }, []);

  // Load family info when family ID is available
  useEffect(() => {
    if (userFamilyInfo?.familyId) {
      loadFamilyInfo(userFamilyInfo.familyId);
    }
  }, [userFamilyInfo?.familyId]);

  const loadUserProfile = async () => {
    try {
      const response = await api.get('/api/profile');
      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        setProfileForm({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          location: userData.location || '',
          bio: userData.bio || '',
          jobTitle: userData.jobTitle || '',
        });
        
        // Set family info for display
        setUserFamilyInfo({
          familyId: userData.familyId,
          familyRole: userData.familyRole,
          familyName: null // Will be loaded separately
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const response = await api.get('/api/profile/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.preferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const loadFamilyInfo = async (familyId: string) => {
    if (!familyId) return;
    
    try {
      const response = await api.get(`/api/family`);
      if (response.ok) {
        const data = await response.json();
        setUserFamilyInfo(prev => ({
          ...prev,
          familyName: data.family?.name || 'Unknown Family'
        }));
      }
    } catch (error) {
      console.error('Error loading family info:', error);
    }
  };

  // Handler functions
  const handleSaveProfile = async () => {
    try {
      setError(null);
      const response = await api.put('/api/profile', profileForm);
      
      if (response.ok) {
        setIsEditingProfile(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    }
  };

  const handlePasswordChange = async () => {
    try {
      setError(null);
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }

      const response = await api.put('/api/profile/password', passwordForm);
      
      if (response.ok) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Failed to change password');
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    try {
      const updatedNotifications = { ...notifications, [key]: value };
      setNotifications(updatedNotifications);

      const response = await api.put('/api/profile/notifications', updatedNotifications);
      
      if (!response.ok) {
        // Revert on error
        setNotifications(notifications);
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update notification preferences');
      }
    } catch (error) {
      // Revert on error
      setNotifications(notifications);
      setError('Failed to update notification preferences');
    }
  };

  const handleExportData = async () => {
    try {
      setError(null);
      const response = await api.get('/api/data/export?format=json');
      
      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to export data');
      }
    } catch (error) {
      setError('Failed to export data');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Member since {new Date().toLocaleDateString()}
                </p>
              </div>
              <Button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
              </Button>
            </div>

            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Full Name
                    </label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email Address
                    </label>
                    <Input
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Enter your email"
                      type="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone Number
                    </label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Enter your phone number"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Location
                    </label>
                    <Input
                      value={profileForm.location}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Briefcase className="inline h-4 w-4 mr-1" />
                      Job Title
                    </label>
                    <Input
                      value={profileForm.jobTitle}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                      disabled={!isEditingProfile}
                      placeholder="Your job title"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditingProfile}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800"
                  />
                </div>

                {/* Family Information Section - Display Only */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    👨‍👩‍👧‍👦 Family Information
                  </h4>
                  {userFamilyInfo?.familyId ? (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Family
                          </label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {userFamilyInfo.familyName || 'Loading...'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Your Role
                          </label>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {userFamilyInfo.familyRole === 'head' && '👑 Head (Family Leader)'}
                            {userFamilyInfo.familyRole === 'adult' && '👤 Adult (Full Access)'}
                            {userFamilyInfo.familyRole === 'child' && '🧒 Child (Limited Access)'}
                            {!userFamilyInfo.familyRole && 'Not set'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        💡 To change your family or role, visit the <a href="/family" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Family Dashboard</a>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                        🏠 No Family Assigned
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                        You're not currently part of any family. This is needed for family expense tracking.
                      </p>
                      <a 
                        href="/family" 
                        className="inline-flex items-center text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md transition-colors"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Go to Family Dashboard
                      </a>
                    </div>
                  )}
                </div>
                {isEditingProfile && (
                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            {/* Currency Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Currency Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Currency
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Preview</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Example amount: {formatCurrency(1234.56, selectedCurrency)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <Link href="/settings/currency">
                    <Button variant="outline" className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Advanced Currency Management</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSave}
                    disabled={selectedCurrency === currentCurrency.code}
                  >
                    Save Currency Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exchange Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Exchange Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {exchangeRates
                    .filter(rate => rate.fromCurrency === 'USD')
                    .map((rate) => {
                      const rateId = `${rate.fromCurrency}-${rate.toCurrency}`;
                      const isEditing = editingRate === rateId;
                      
                      return (
                        <div key={rateId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">
                              1 {rate.fromCurrency} = 
                            </span>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.0001"
                                value={editRateValue}
                                onChange={(e) => setEditRateValue(e.target.value)}
                                className="w-24 h-8 text-sm"
                              />
                            ) : (
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {rate.rate.toFixed(4)}
                              </span>
                            )}
                            <span className="font-medium text-sm">{rate.toCurrency}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveRate(rate.fromCurrency, rate.toCurrency)}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRate(rateId, rate.rate)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            {family ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Family: {family.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {family.members.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {family.currency}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Currency</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          Member
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Your Role</div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <Button variant="outline">
                        Manage Family Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Family Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create or join a family to manage shared expenses and budgets.
                  </p>
                  <Button>Create Family</Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} className="w-full">
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {getNotificationDescription(key)}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleNotificationChange(key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Theme & Appearance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-4 border-2 border-blue-500 rounded-lg bg-white text-gray-900">
                      <div className="w-full h-8 bg-gray-100 rounded mb-2"></div>
                      <div className="text-sm font-medium">Light</div>
                    </button>
                    <button className="p-4 border-2 border-gray-300 rounded-lg bg-gray-900 text-white">
                      <div className="w-full h-8 bg-gray-800 rounded mb-2"></div>
                      <div className="text-sm font-medium">Dark</div>
                    </button>
                    <button className="p-4 border-2 border-gray-300 rounded-lg bg-gradient-to-br from-white to-gray-900 text-gray-900">
                      <div className="w-full h-8 bg-gradient-to-r from-gray-100 to-gray-800 rounded mb-2"></div>
                      <div className="text-sm font-medium">Auto</div>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleExportData} className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export All Data</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Import Data</span>
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h4>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 flex items-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Account</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const getNotificationDescription = (key: string) => {
    const descriptions: Record<string, string> = {
      emailNotifications: 'Receive email updates about your account',
      pushNotifications: 'Get push notifications on your device',
      weeklyReports: 'Weekly summary of your expenses and income',
      budgetAlerts: 'Alerts when you approach budget limits',
      familyUpdates: 'Notifications about family expense activities',
      expenseReminders: 'Reminders to log your daily expenses',
    };
    return descriptions[key] || '';
  };

  return (
    <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and application settings
        </p>
      </div>

      {isSaved && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-green-800 dark:text-green-200">
            Settings saved successfully!
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-800 dark:text-red-200">
            {error}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

// Helper function to format currency for preview
function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrencyList().find(c => c.code === currencyCode);
  if (!currency) return '';
  
  let formatted = amount.toFixed(currency.decimalDigits);
  if (currency.decimalDigits > 0) {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
    formatted = parts.join(currency.decimalSeparator);
  } else {
    formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
  }
  
  return currency.symbolOnLeft
    ? `${currency.symbol}${currency.spaceBetweenAmountAndSymbol ? ' ' : ''}${formatted}`
    : `${formatted}${currency.spaceBetweenAmountAndSymbol ? ' ' : ''}${currency.symbol}`;
}
