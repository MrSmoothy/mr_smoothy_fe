"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

/**
 * Interface สำหรับข้อมูลที่ใช้ใน dropdown
 */
export interface DropdownOption {
  id: number;
  name: string;
  [key: string]: any; // สำหรับข้อมูลเพิ่มเติม
}

/**
 * Interface สำหรับ configuration ของ SearchableDropdown
 */
export interface SearchableDropdownConfig {
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Class สำหรับจัดการ state และ logic ของ SearchableDropdown
 * ใช้แนวคิด OOP เพื่อแยก logic ออกจาก UI
 */
class SearchableDropdownController {
  private searchQuery: string = "";
  private isOpen: boolean = false;
  private selectedValue: number | null = null;
  private filteredOptions: DropdownOption[] = [];
  private allOptions: DropdownOption[] = [];

  constructor(
    private options: DropdownOption[],
    private onSelect: (value: number) => void,
    private config: SearchableDropdownConfig = {}
  ) {
    this.allOptions = options;
    this.filteredOptions = options;
  }

  /**
   * อัปเดต options เมื่อมีการเปลี่ยนแปลง
   */
  updateOptions(options: DropdownOption[]) {
    this.allOptions = options;
    this.filter();
  }

  /**
   * ตั้งค่า selected value
   */
  setSelectedValue(value: number | null) {
    this.selectedValue = value;
  }

  /**
   * ดึง selected value
   */
  getSelectedValue(): number | null {
    return this.selectedValue;
  }

  /**
   * ตั้งค่า search query และ filter options
   */
  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.filter();
  }

  /**
   * ดึง search query
   */
  getSearchQuery(): string {
    return this.searchQuery;
  }

  /**
   * Filter options ตาม search query
   */
  private filter() {
    if (!this.searchQuery.trim()) {
      this.filteredOptions = this.allOptions;
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredOptions = this.allOptions.filter((option) =>
      option.name.toLowerCase().includes(query)
    );
  }

  /**
   * ดึง filtered options
   */
  getFilteredOptions(): DropdownOption[] {
    return this.filteredOptions;
  }

  /**
   * เปิด/ปิด dropdown
   */
  toggle() {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.searchQuery = "";
      this.filter();
    }
  }

  /**
   * เปิด dropdown
   */
  open() {
    this.isOpen = true;
  }

  /**
   * ปิด dropdown
   */
  close() {
    this.isOpen = false;
    this.searchQuery = "";
    this.filter();
  }

  /**
   * ตรวจสอบว่า dropdown เปิดอยู่หรือไม่
   */
  isDropdownOpen(): boolean {
    return this.isOpen;
  }

  /**
   * เลือก option
   */
  selectOption(optionId: number) {
    this.selectedValue = optionId;
    this.onSelect(optionId);
    this.close();
  }

  /**
   * ดึง selected option
   */
  getSelectedOption(): DropdownOption | null {
    if (this.selectedValue === null) return null;
    return (
      this.allOptions.find((opt) => opt.id === this.selectedValue) || null
    );
  }

  /**
   * Clear selection
   */
  clear() {
    this.selectedValue = null;
    this.searchQuery = "";
    this.filter();
  }

  /**
   * ดึง config
   */
  getConfig(): SearchableDropdownConfig {
    return this.config;
  }
}

/**
 * React Component สำหรับ SearchableDropdown
 * ใช้ SearchableDropdownController เพื่อจัดการ logic
 */
interface SearchableDropdownProps {
  options: DropdownOption[];
  value: number | null;
  onChange: (value: number) => void;
  config?: SearchableDropdownConfig;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  config = {},
}: SearchableDropdownProps) {
  const [controller] = useState(
    () =>
      new SearchableDropdownController(options, onChange, {
        placeholder: "เลือกวัตถุดิบ...",
        searchPlaceholder: "พิมพ์เพื่อค้นหา...",
        noResultsText: "ไม่พบผลลัพธ์",
        ...config,
      })
  );

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // อัปเดต controller เมื่อ options หรือ value เปลี่ยน
  useEffect(() => {
    controller.updateOptions(options);
    controller.setSelectedValue(value);
  }, [options, value]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        controller.close();
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Focus input เมื่อเปิด dropdown
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = controller.getSelectedOption();
  const filteredOptions = controller.getFilteredOptions();
  const finalConfig = controller.getConfig();

  function handleToggle() {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      controller.open();
    } else {
      controller.close();
      setSearchQuery("");
    }
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value;
    setSearchQuery(query);
    controller.setSearchQuery(query);
  }

  function handleSelect(optionId: number) {
    controller.selectOption(optionId);
    setIsOpen(false);
    setSearchQuery("");
    onChange(optionId);
  }


  return (
    <div
      ref={dropdownRef}
      className={`relative ${finalConfig.className || ""}`}
    >
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={finalConfig.disabled}
        className={`w-full flex items-center justify-between rounded-md border border-[#14433B]/30 px-4 py-2 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50 ${
          finalConfig.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.name : finalConfig.placeholder}
        </span>
        <div className="flex items-center gap-2 ml-2">
          <ChevronDown
            className={`w-4 h-4 text-[#14433B]/50 transition-transform ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-[#14433B]/30 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-[#14433B]/20">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={finalConfig.searchPlaceholder}
              className="w-full px-3 py-2 rounded-md border border-[#14433B]/20 text-[#14433B] outline-none focus:ring-2 focus:ring-[#14433B]/50"
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#14433B]/70 text-center">
                {finalConfig.noResultsText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`w-full text-left px-4 py-2 hover:bg-[#14433B]/10 transition-colors ${
                    selectedOption?.id === option.id
                      ? "bg-[#14433B]/20 font-semibold"
                      : ""
                  }`}
                >
                  {option.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

